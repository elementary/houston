/**
 * houston/controller/project.js
 * Simple project handling (until official API is set)
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as github from '~/houston/service/github'
import * as policy from '~/houston/policy'
import Cycle from '~/houston/model/cycle'
import Project from '~/houston/model/project'
import Release from '~/houston/model/release'

const route = new Router({
  prefix: '/project/:owner/:name'
})

// TODO: we should probably do some data checks here. for 'security' and stuff
route.get('/*', policy.isRole('beta'), async (ctx, next) => {
  ctx.project = await Project.findOne({
    'github.owner': ctx.params.owner,
    'github.name': ctx.params.name
  })

  if (ctx.project == null) {
    throw new ctx.Mistake(404, 'Project not found')
  }

  await next()
})

route.get('/init', async (ctx, next) => {
  const status = await ctx.project.getStatus()

  if (status !== 'NEW') throw new ctx.Mistake(400, 'The project is already initalized')

  const gh = ctx.project.github

  await Promise.all([
    github.getReleases(gh.owner, gh.name, gh.token).each((release) => {
      return Release.create(release)
      .then((release) => ctx.project.update({$push: {releases: release._id}}))
    }),
    ctx.project.postLabel(),
    ctx.project.update({ _status: 'INIT' })
  ])
  .catch((err) => {
    throw new ctx.Mistake(500, `Unable to setup ${ctx.project.name} with Houston`, err)
  })

  return ctx.redirect('/dashboard')
})

route.get('/cycle', async (ctx, next) => {
  if (ctx.project.releases.length < 1) {
    throw new ctx.Mistake(400, 'The project has no releases to cycle')
  }

  const release = await Release
  .findOne({_id: {$in: ctx.project.releases}})
  .sort({'github.date': -1})

  const cycle = new Cycle({
    type: 'RELEASE'
  })

  return Promise.all([
    cycle.save(),
    ctx.project.update({$push: {cycles: cycle._id}}),
    release.update({$push: {cycles: cycle._id}})
  ])
  .then(() => ctx.redirect('/dashboard'))
  .catch((err) => {
    throw new ctx.Mistake(500, 'An error occured while creating a new release cycle', err)
  })
})

route.get('/review/:fate', policy.isRole('review'), async (ctx, next) => {
  if (ctx.project.releases.length < 1) {
    throw new ctx.Mistake(400, 'The project has no releases')
  }

  // All hail our lord and savior, GitHub release date sort
  const release = await Release
  .findOne({_id: {$in: ctx.project.releases}})
  .sort({'github.date': -1})

  if (release == null) {
    throw new ctx.Mistake(404, 'Could not find release')
  }

  const cycle = await Cycle
  .findOne({_id: {$in: release.cycles}})
  .sort({'_id': -1})

  if (cycle == null) {
    throw new ctx.Mistake(404, 'Release has no cycle')
  }

  const status = await cycle.getStatus()

  if (status !== 'REVIEW') {
    throw new ctx.Mistake(400, 'Release is not awaiting review')
  }

  if (ctx.params.fate === 'yes') {
    return cycle.release()
    .then(() => cycle.update({ _status: 'FINISH' }))
    .then(() => ctx.redirect('/dashboard'))
  } else if (ctx.params.fate === 'no') {
    return cycle.update({ _status: 'FAIL' })
    .then(() => ctx.redirect('/dashboard'))
  } else {
    throw new ctx.Mistake(400, `${ctx.project.name}'s fate is binary'`)
  }
})

export default route
