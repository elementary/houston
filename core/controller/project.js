/**
 * core/controller/project.js
 * Simple project handling (until official API is set)
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Project } from '~/core/model/project'
import { Release } from '~/core/model/release'
import { Cycle } from '~/core/model/cycle'
import { Build } from '~/core/model/build'
import { IsRole } from '~/core/policy/isRole'
import { GetReleases } from '~/core/service/github'

// TODO: GitHub hook integration
let route = new Router({
  prefix: '/project/:owner/:name'
})

// TODO: we should probably do some data checks here. for 'security' and stuff
route.get('/*', IsRole('BETA'), async (ctx, next) => {
  ctx.project = await Project.findOne({
    'github.owner': ctx.params.owner,
    'github.name': ctx.params.name
  })

  if (ctx.project == null) {
    return ctx.throw('The project you are looking for has been lost in space', 404)
  }

  await next()
})

route.get('/init', async (ctx, next) => {
  const status = await ctx.project.getStatus()
  .catch(err => ctx.throw({
    message: 'Unable to get project status',
    error: err
  }, 500))

  if (status !== 'NEW') return ctx.throw('The project is already in standby', 400)

  const github = ctx.project.github

  await Promise.all([
    GetReleases(github.owner, github.name, github.token).each(release => {
      return Release.create(release)
      .then(release => ctx.project.update({$push: {releases: release._id}}))
    }),
    ctx.project.postLabel(),
    ctx.project.update({ _status: 'INIT' })
  ])
  .catch(err => ctx.throw({
    message: `Unable to setup ${ctx.project.name} with Houston`,
    error: err
  }, 500))

  return ctx.redirect('/dashboard')
})

route.get('/cycle', async (ctx, next) => {
  if (ctx.project.releases.length < 1) {
    return ctx.throw('The project has no releases to cycle', 400)
  }

  const release = await Release.findOne({_id: {$in: ctx.project.releases}})

  const cycle = new Cycle({
    type: 'RELEASE'
  })

  return Promise.all([
    cycle.save(),
    ctx.project.update({$push: {cycles: cycle._id}}),
    release.update({$push: {cycles: cycle._id}})
  ])
  .then(ctx.redirect('/dashboard'))
  .catch(err => ctx.throw({
    message: 'An error occured while creating a new release cycle',
    error: err
  }, 500))
})

export const Route = route
