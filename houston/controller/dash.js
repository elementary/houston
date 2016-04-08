/**
 * houston/controller/dash.js
 * Handles the dashboard and static pages
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as github from '~/core/service/github'
import * as policy from '~/core/policy'
import Cycle from '~/houston/model/cycle'
import log from '~/lib/log'
import Project from '~/houston/model/project'

const route = new Router()

route.get('/', (ctx) => {
  return ctx.render('index', { hideUser: true })
})

route.get('/dashboard', policy.isRole('user'), async (ctx, next) => {
  const projects = await github.getProjects(ctx.user.github.access)
  .map(async (repo) => {
    const db = await Project.findOne({ 'github.id': repo.github.id })
    if (db != null) return db

    log.silly(`Creating a new project for ${repo.github.owner}/${repo.github.name}`)
    return Project.create(Object.assign({
      owner: ctx.user._id
    }, repo))
  })
  .map(async (project) => {
    project.status = await project.getStatus()
    project.version = await project.getVersion()

    return project
  })

  // TODO: Get some design input on this, and possibly a unique page
  let reviews = []
  if (policy.ifRole(ctx.user, 'review')) {
    log.silly('Grabbing projects waiting to be reviewed')

    reviews = await Cycle.find({
      type: 'RELEASE',
      _status: 'REVIEW'
    })
    .map(async (cycle) => {
      cycle.project = await cycle.getProject()
      cycle.release = await cycle.getRelease()

      return cycle
    })
  }

  return ctx.render('dashboard', { title: 'Dashboard', projects, reviews })
})

export default route
