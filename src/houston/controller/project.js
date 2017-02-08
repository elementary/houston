/**
 * houston/controller/project.js
 * Simple project handling (until official API is set)
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as aptly from 'houston/service/aptly'
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
route.get('/cycle', policy.isRole('BETA'), policy.isAgreement, async (ctx, next) => {
  const name = Project.sanatize(ctx.params.project)
  const project = await Project.findByDomain(name)

  if (project == null) {
    throw new error.ControllerError(404, 'Project not found')
  }

  if (!policy.ifMember(project, ctx.state.user)) {
    throw new error.ControllerError(403, 'You do not have permission to cycle this project')
  }

  const release = await project.findRelease()

  if (release == null) {
    throw new error.ControllerError(400, 'The project has no releases to cycle')
  }

  await release.createCycle('RELEASE')
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
  const name = Project.sanatize(ctx.params.project)
  const project = await Project.findByDomain(name)

<<<<<<< HEAD
  if (project == null) {
    throw new ctx.Mistake(404, 'Project not found')
  }

  const release = await project.findRelease()

  if (release == null) {
    throw new ctx.Mistake(400, 'The project has no releases', true)
=======
  if (ctx.project == null) {
    throw new error.ControllerError(404, 'Project not found')
  }

  if (ctx.project.releases.length < 1) {
    throw new error.ControllerError(400, 'The project has no releases', true)
>>>>>>> 65f929cb8d917c27a1535b003fa548797307fbec
  }

  const status = await release.getStatus()

  if (status !== 'REVIEW') {
    throw new error.ControllerError(400, 'Release is not awaiting review', true)
  }

  if (ctx.params.fate !== 'yes' && ctx.params.fate !== 'no') {
    throw new error.ControllerError(400, `${ctx.project.name}'s fate is binary'`, true)
  }

  const cycle = await release.cycle.latest

  if (ctx.params.fate === 'yes') {
    await aptly.stable(cycle.packages)
    await cycle.setStatus('FINISH')
  } else {
    await cycle.setStatus('FAIL')
  }

  return ctx.redirect('/dashboard')
})

export default route
