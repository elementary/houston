/**
 * houston/controller/dashboard.js
 * Handles all rendered pages
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as github from '~/houston/service/github'
import * as policy from '~/houston/policy'
import Cycle from '~/houston/model/cycle'
import log from '~/lib/log'
import Project from '~/houston/model/project'

const route = new Router()

/**
 * GET /
 * Homepage
 */
route.get('', (ctx) => {
  return ctx.render('index', { hideUser: true })
})

/**
 * GET /dashboard
 * Shows all projects
 */
route.get('/dashboard', policy.isRole('beta'), async (ctx, next) => {
  const projects = await github.getProjects(ctx.user.github.access)
  .map(async (repo) => {
    const db = await Project.findOne({ 'github.id': repo.github.id })

    if (db != null) return db

    log.debug(`Creating a new project for ${repo.github.owner}/${repo.github.name}`)

    return Project.create(Object.assign(repo, {
      owner: ctx.user._id
    }))
    .catch({code: 11000}, () => { // duplicate key error (project name already exists)
      // TODO: replace this with a better system when we move to client side project importing
      return Project.create(Object.assign(repo, {
        name: `${repo.github.owner}-${repo.name}`,
        package: {
          name: `${repo.github.owner}-${repo.name}`
        },
        owner: ctx.user._id
      }))
    })
  })
  .map(async (project) => {
    project.status = await project.getStatus()

    return project
  })

  // TODO: Get some design input on this, and possibly a unique page
  let reviews = []
  if (policy.ifRole(ctx.user, 'review')) {
    log.debug('Grabbing projects waiting to be reviewed')

    reviews = await Cycle.find({
      type: 'RELEASE',
      _status: 'REVIEW'
    })
    .exec()
  }

  return ctx.render('dashboard', { title: 'Dashboard', projects, reviews })
})

export default route
