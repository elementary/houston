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
 * GET /project/:project/*
 * Grabs any route here, searches in the db, and returns db object to next route
 *
 * @param {String} project - project name
 */
route.get('/*', policy.isRole('beta'), async (ctx, next) => {
  ctx.project = await Project.findOne({
    name: ctx.params.project
  }).exec()

  if (ctx.project == null) {
    throw new ctx.Mistake(404, 'Project not found')
  }

  await next()

  return ctx.redirect('/dashboard')
})

/**
 * GET /project/:project/init
 * Changes project status to init
 *
 * @param {String} project - project name
 */
route.get('/init', async (ctx, next) => {
  const status = await ctx.project.getStatus()

  if (status !== 'NEW') throw new ctx.Mistake(400, 'The project is already initalized', true)

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

  return github.getReleases(gh.owner, gh.name, gh.token)
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
})

/**
 * GET /project/:project/cycle
 * Creates a new release cycle for project
 *
 * @param {String} project - project name
 */
route.get('/cycle', async (ctx, next) => {
  if (ctx.project.releases.length < 1) {
    throw new ctx.Mistake(400, 'The project has no releases to cycle')
  }

  return ctx.project.createCycle('RELEASE')
  .catch((err) => {
    throw new ctx.Mistake(500, 'An error occured while creating a new release cycle', err, true)
  })
})

/**
 * GET /project/:project/review
 * Sets review status from project
 *
 * @param {String} project - project name
 * @param {String} fate - yes or no approval for latest release review
 */
route.get('/review/:fate', policy.isRole('review'), async (ctx, next) => {
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
    return cycle.setStatus('FINISH')
    .then(() => aptly.stable(cycle.packages, ctx.project.dists))
  } else {
    return cycle.setStatus('FAIL')
  }
})

export default route
