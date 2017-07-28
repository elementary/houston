/**
 * houston/controller/dashboard.js
 * Handles all rendered pages
 *
 * @exports {Object} - Koa router
 */

import _ from 'lodash'
import Promise from 'bluebird'
import Router from 'koa-router'
import semver from 'semver'

import * as github from 'service/github'
import * as policy from 'houston/policy'
import Cycle from 'lib/database/cycle'
import Project from 'lib/database/project'

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
route.get('/dashboard', policy.isRole('USER'), policy.isAgreement, async (ctx, next) => {
  const githubProjects = await github.getReposForUser(ctx.state.user)
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
route.get('/reviews', policy.isRole('REVIEW'), policy.isAgreement, async (ctx, next) => {
  const cycles = await Cycle.find({ _status: 'REVIEW' })
    .populate('project')
    .then((cycles) => _.groupBy(cycles, 'project._id'))
    // Sort all the cycles in review so we get the latest version.
    .then((projects) => {
      const output = []

      Object.keys(projects).forEach((key) => {
        const cycles = projects[key].sort((a, b) => semver.compare(b.version, a.version))
        output.push(cycles[0])
      })

      return output
    })
    // Filter out any cycles that have newer cycles.
    .then((cycles) => {
      return cycles.filter((cycle) => {
        const latestRelease = cycle.project.release.latest

        return (latestRelease.version === cycle.version)
      })
    })
    // We can manually set the project status instead of calling the DB again
    .then((cycles) => cycles.map((cycle) => {
      cycle.project.status = 'REVIEW'
      return cycle
    }))

  return ctx.render('review', { title: 'Reviews', cycles })
})

/**
 * GET /beta
 * Shows a beta signup page
 */
route.get('/beta', policy.isRole('USER'), async (ctx, next) => {
  return ctx.redirect('/dashboard')
})

export default route
