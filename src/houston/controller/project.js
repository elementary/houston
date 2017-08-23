/**
 * houston/controller/project.js
 * Simple project handling (until official API is set)
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as aptly from 'service/aptly'
import * as error from 'lib/error/controller'
import * as policy from 'houston/policy'
import Project from 'lib/database/project'

const route = new Router({
  prefix: '/project/:project'
})

/**
 * GET /project/:project/cycle
 * Creates a new release cycle for project
 *
 * @param {String} project - project name
 */
route.get('/cycle', policy.isRole('USER'), policy.isAgreement, async (ctx, next) => {
  const project = await Project.findOne({
    name: ctx.params.project
  })

  if (project == null) {
    throw new error.ControllerError(404, 'Project not found')
  }

  if (!policy.ifMember(project, ctx.state.user)) {
    throw new error.ControllerError(403, 'You do not have permission to cycle this project')
  }

  if (project.releases.length < 1) {
    throw new error.ControllerError(400, 'The project has no releases to cycle')
  }

  if (project.release.latest._status !== 'STANDBY' && policy.ifRole(ctx.state.user, 'ADMIN') === false) {
    throw new error.ControllerError(400, 'The project has already been cycled')
  }

  await project.createCycle('RELEASE')
  .catch((err) => {
    throw new error.ControllerError(500, 'An error occured while creating a new release cycle', err, true)
  })

  return ctx.redirect('/dashboard')
})

/**
 * GET /project/:project/review
 * Sets review status from project
 *
 * @param {String} project - project name
 * @param {String} fate - yes or no approval for latest release review
 */
route.get('/review/:fate', policy.isRole('REVIEW'), async (ctx, next) => {
  ctx.project = await Project.findOne({
    name: ctx.params.project
  }).exec()

  if (ctx.project == null) {
    throw new error.ControllerError(404, 'Project not found')
  }

  if (ctx.project.releases.length < 1) {
    throw new error.ControllerError(400, 'The project has no releases', true)
  }

  const release = await ctx.project.release.latest
  const status = await release.getStatus()

  if (status !== 'REVIEW') {
    throw new error.ControllerError(400, 'Release is not awaiting review', true)
  }

  if (ctx.params.fate !== 'yes' && ctx.params.fate !== 'no') {
    throw new error.ControllerError(400, `${ctx.project.name}'s fate is binary'`, true)
  }

  const cycle = await release.cycle.latest

  if (ctx.params.fate === 'yes') {
    await Promise.all([
      aptly.stable(cycle.packages),
      cycle.setStatus('FINISH'),
      release.update({ 'date.published': new Date() })
    ])
  } else {
    await cycle.setStatus('FAIL')
  }

  return ctx.redirect('/dashboard')
})

export default route
