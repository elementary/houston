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
import Log from 'lib/log'
import Project from 'houston/model/project'
import User from 'houston/model/user'

const route = new Router()
const log = new Log('controller:dashboard')

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
route.get('/dashboard', policy.isRole('BETA'), async (ctx, next) => {
  const githubProjects = await github.getRepos(ctx.state.user.github.access)
  .map((repo) => repo.github.id)

  const databaseProjects = await Project.find({
    'github.id': { $in: githubProjects }
  })
  .populate('stripe.user')

  const projects = await Promise.resolve(databaseProjects)
  .map(async (project) => {
    project.status = await project.getStatus()

    return project
  })

  return ctx.render('dashboard', { title: 'Dashboard', projects })
})

/**
 * GET /reviews
 * Shows all the outstanding reviews
 */
route.get('/reviews', policy.isRole('REVIEW'), async (ctx, next) => {
  const cycles = await Cycle.find({
    type: 'RELEASE',
    _status: 'REVIEW'
  })
  .populate('project')

  // We can manually set the project status instead of calling the DB again
  cycles.map((cycle) => {
    cycle.project.status = 'REVIEW'
    return cycle
  })

  return ctx.render('review', { title: 'Reviews', cycles })
})

/**
 * GET /beta
 * Shows a beta signup page
 */
route.get('/beta', policy.isRole('USER'), async (ctx, next) => {
  ctx.state.title = 'Beta'

  if (policy.ifRole(ctx.state.user, 'BETA')) {
    return ctx.render('beta/congratulations')
  }

  return ctx.render('beta/form', {
    email: ctx.state.user.email,
    isBeta: ctx.state.user.notify.beta
  })
})

/**
 * POST /beta
 * Ensures user's email is set for beta
 */
route.post('/beta', policy.isRole('USER'), async (ctx, next) => {
  ctx.state.title = 'Beta'

  if (typeof ctx.request.body.email !== 'string') {
    log.debug('/beta called without body email')

    ctx.status = 406
    return ctx.render('beta/form', {
      email: ctx.state.user.email,
      isBeta: ctx.state.user.notify.beta
    })
  }

  const email = ctx.request.body.email

  // And here is a very simple email regex test because life is too short for
  // yet another npm package
  if (!/([a-z0-9]+)@([a-z0-9]+)\.([a-z]+)/i.test(email)) {
    log.debug('/beta called with invalid email address')

    ctx.status = 406
    return ctx.render('beta/form', {
      email,
      isBeta: ctx.state.user.notify.beta,
      error: 'Invalid email address'
    })
  }

  await User.findByIdAndUpdate(ctx.state.user._id, {
    email,
    'notify.beta': true
  })

  return ctx.render('beta/form', {
    email,
    isBeta: true
  })
})

export default route
