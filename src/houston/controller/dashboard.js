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
  })
  .map(async (project) => {
    project.status = await project.getStatus()

    return project
  })

  return ctx.render('dashboard', { title: 'Dashboard', projects })
})

route.get('/reviews', policy.isRole('review'), async (ctx, next) => {
  const cycles = await Cycle.find({
    type: 'RELEASE',
    _status: 'REVIEW'
  })
  .populate('project')
  .exec()

  return ctx.render('review', { title: 'Reviews', cycles })
})

export default route
