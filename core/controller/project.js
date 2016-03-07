/**
 * core/controller/project.js
 * Simple project handling (until official API is set)
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Log } from '~/app'
import { Project } from '~/core/model/project'
import { Release } from '~/core/model/release'
import { Cycle } from '~/core/model/cycle'
import { IsRole } from '~/core/policy/isRole'
import { GetReleases } from '~/core/service/github'

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
  .catch(err => {
    Log.error(err)
    ctx.throw('Unable to get project status', 500)
  })

  if (status !== 'NEW') return ctx.throw('The project is already initalized', 400)

  const github = ctx.project.github

  await Promise.all([
    GetReleases(github.owner, github.name, github.token).each(release => {
      return Release.create(release)
      .then(release => ctx.project.update({$push: {releases: release._id}}))
    }),
    ctx.project.postLabel(),
    ctx.project.update({ _status: 'INIT' })
  ])
  .catch(err => {
    Log.warn(err)
    ctx.throw(`Unable to setup ${ctx.project.name} with Houston`, 500)
  })

  return ctx.redirect('/dashboard')
})

route.get('/cycle', async (ctx, next) => {
  if (ctx.project.releases.length < 1) {
    return ctx.throw('The project has no releases to cycle', 400)
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
  .then(ctx.redirect('/dashboard'))
  .catch(err => {
    Log.error(err)
    ctx.throw('An error occured while creating a new release cycle', 500)
  })
})

route.get('/review/:fate', IsRole('REVIEW'), async (ctx, next) => {
  if (ctx.project.releases.length < 1) {
    return ctx.throw('The project has no releases', 400)
  }

  // All hail our lord and savior, GitHub release date sort
  const release = await Release
  .findOne({_id: {$in: ctx.project.releases}})
  .sort({'github.date': -1})

  if (release == null) {
    return ctx.throw('Could not find release', 404)
  }

  const cycle = await Cycle
  .findOne({_id: {$in: release.cycles}})
  .sort({'_id': -1})

  if (cycle == null) {
    return ctx.throw('Release has no cycle', 404)
  }

  const status = await cycle.getStatus()

  if (status !== 'REVIEW') {
    return ctx.throw('Release is not awaiting review', 400)
  }

  if (ctx.params.fate === 'yes') {
    return cycle.release()
    .then(() => {}, ctx.throw('Unable to push release to repository', 500))
    .then(cycle.update({ _status: 'FINISH' }))
    .then(ctx.redirect('/dashboard'))
  } else if (ctx.params.fate === 'no') {
    return cycle.update({ _status: 'FAIL' })
    .then(ctx.redirect('/dashboard'))
  } else {
    return ctx.throw(`${ctx.project.name}'s fate is binary'`, 400)
  }
})

export const Route = route
