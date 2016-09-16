/**
 * houston/controller/dashboard.js
 * Handles all rendered pages
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as github from 'houston/service/github'
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
  const projects = await github.getProjects(ctx.user.github.access)
  .map((repo) => Project.findOne({ 'github.id': repo.github.id }))
  .filter((repo) => (repo != null))
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

route.get('/add', policy.isRole('beta'), async (ctx, next) => {
  const projects = await github.getProjects(ctx.user.github.access)
  .filter(async (repo) => {
    const dbProject = await Project.findOne({ 'github.id': repo.github.id })
    return (dbProject == null) // Only return github repos which have not been added
  })

  return ctx.render('add', { title: 'Adding', projects })
})

export default route
