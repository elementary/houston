/**
 * houston/controller/project.js
 * Simple project handling (until official API is set)
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as aptly from 'houston/service/aptly'
import * as policy from 'houston/policy'
import Project from 'houston/model/project'

const route = new Router({
  prefix: '/project/:project'
})

/**
 * GET /project/:project/cycle
 * Creates a new release cycle for project
 *
 * @param {String} project - project name
 */
route.get('/cycle', async (ctx, next) => {
  const project = await Project.findOne({
    name: ctx.params.project
  })

  if (project == null) {
    throw new ctx.Mistake(404, 'Project not found')
  }

  if (!policy.ifMember(project, ctx.state.user)) {
    throw new ctx.Mistake(403, 'You do not have permission to cycle this project')
  }

  if (project.releases.length < 1) {
    throw new ctx.Mistake(400, 'The project has no releases to cycle')
  }

  await project.createCycle('RELEASE')
  .catch((err) => {
    throw new ctx.Mistake(500, 'An error occured while creating a new release cycle', err, true)
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
route.get('/review/:fate', policy.isRole('review'), async (ctx, next) => {
  ctx.project = await Project.findOne({
    name: ctx.params.project
  }).exec()

  if (ctx.project == null) {
    throw new ctx.Mistake(404, 'Project not found')
  }

  if (ctx.project.releases.length < 1) {
    throw new ctx.Mistake(400, 'The project has no releases', true)
  }

  const release = await ctx.project.release.latest
  const status = await release.getStatus()

  if (status !== 'REVIEW') {
    throw new ctx.Mistake(400, 'Release is not awaiting review', true)
  }

  if (ctx.params.fate !== 'yes' && ctx.params.fate !== 'no') {
    throw new ctx.Mistake(400, `${ctx.project.name}'s fate is binary'`, true)
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
