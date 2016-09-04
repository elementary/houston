/**
 * houston/controller/project.js
 * Simple project handling (until official API is set)
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'
import semver from 'semver'

import * as aptly from '~/houston/service/aptly'
import * as github from '~/houston/service/github'
import * as policy from '~/houston/policy'
import config from '~/lib/config'
import Project from '~/houston/model/project'

const route = new Router({
  prefix: '/project/:project'
})

/**
 * GET /project/:project/init
 * Changes project status to init
 *
 * @param {String} project - project name
 */
route.get('/init', policy.isRole('beta'), async (ctx, next) => {
  if (!/com\.github\..+\..+/.test(ctx.params.project)) {
    throw new ctx.Mistake(404, 'Only able to setup GitHub projects')
  }

  const dp = await Project.findOne({
    name: ctx.params.project
  }).exec()

  if (dp !== null) {
    throw new ctx.Mistake(500, 'Project is already initalized')
  }

  const [owner, name] = ctx.params.project.replace('com.github.', '').split('.')

  if (!await github.getPermission(owner, name, ctx.user.username, ctx.user.github.access)) {
    throw new ctx.Mistake(500, 'User does not have permissions to setup project')
  }

  const tmpP = await github.getProject(owner, name, ctx.user.github.access)
  tmpP['owner'] = ctx.user._id
  ctx.project = await Project.create(tmpP)

  await ctx.user.update({
    $push: { projects: ctx.project._id }
  })

  const gh = ctx.project.github

  if (config.github.hook) {
    github.upsertHook(gh.owner, gh.name, gh.token, gh.secret)
    .then((hookId) => {
      return Project.findByIdAndUpdate(ctx.project._id, {
        'github.hook': hookId
      })
    })
    .catch((err) => {
      throw new ctx.Mistake(500, `Unable to setup ${ctx.project.name} GitHub hooks`, err, true)
    })
  }

  await github.getReleases(gh.owner, gh.name, gh.token)
  .then((releases) => releases.sort((a, b) => semver(a.version, b.version)))
  .then((releases) => {
    return Project.findByIdAndUpdate(ctx.project._id, {
      $addToSet: { releases: { $each: releases } }
    }, { new: true })
    .then((project) => {
      if (project.releases.length > 0) {
        return project.setStatus('DEFER')
      } else {
        return project.setStatus('INIT')
      }
    })
  })
  .catch((err) => {
    throw new ctx.Mistake(500, `Unable to setup ${ctx.project.name} with Houston`, err, true)
  })

  return ctx.redirect('/dashboard')
})

/**
 * GET /project/:project/cycle
 * Creates a new release cycle for project
 *
 * @param {String} project - project name
 */
route.get('/cycle', async (ctx, next) => {
  ctx.project = await Project.findOne({
    name: ctx.params.project
  }).exec()

  if (ctx.project == null) {
    throw new ctx.Mistake(404, 'Project not found')
  }

  if (ctx.project.releases.length < 1) {
    throw new ctx.Mistake(400, 'The project has no releases to cycle')
  }

  await ctx.project.createCycle('RELEASE')
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
    await cycle.setStatus('FINISH')
    .then(() => aptly.stable(cycle.packages, ctx.project.dists))
  } else {
    await cycle.setStatus('FAIL')
  }

  return ctx.redirect('/dashboard')
})

export default route
