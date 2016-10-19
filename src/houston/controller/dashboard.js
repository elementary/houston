/**
 * houston/controller/dashboard.js
 * Handles all rendered pages
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'
import Promise from 'bluebird'

import * as github from 'service/github'
import * as policy from 'houston/policy'
import Cycle from 'houston/model/cycle'
import Project from 'houston/model/project'

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
  const githubProjects = await github.getRepos(ctx.user.github.access)
  .map((repo) => repo.github.id)

  const databaseProjects = await Project.find({
    'github.id': { $in: githubProjects }
  })

  const projects = await Promise.resolve(databaseProjects)
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
