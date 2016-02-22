/**
 * core/controller/project.js
 * Simple project handling (until official API is set)
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Log } from '~/app'
import { Project } from '~/core/model/project'
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
  if (await ctx.project.getStatus() !== 'NEW') {
    return ctx.throw('The project is already in standby', 400)
  }

  ctx.project.postLabel()
  await GetReleases(ctx.project.github.owner, ctx.project.github.name, ctx.user.github.access)
  .each(release => {
    return ctx.project.upsertRelease({
      'github.id': release.github.id
    }, release)
  })
  .catch((err) => {
    Log.error(err)
    return ctx.throw(`Unable to get GitHub releases for ${ctx.project.name}`, 500)
  })
  await ctx.project.update({ _status: 'INIT' })

  return ctx.redirect('/dashboard')
})

route.get('/cycle', async (ctx, next) => {
  if (ctx.project.release == null) {
    return ctx.throw('The project has no releases to cycle', 400)
  }

  ctx.project.release.createCycle('RELEASE')
  return ctx.redirect('/dashboard')
})

route.get('/launch', async (ctx, next) => {
  if (ctx.project.release == null) {
    return ctx.throw('The project has no releases to launch', 400)
  }

  await ctx.project.release.createCycle('RELEASE')
  return ctx.redirect('/dashboard')
})

export const Route = route
