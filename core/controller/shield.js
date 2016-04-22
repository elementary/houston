/**
 * core/controller/shield.js
 * Gives markdown shields for projects (http://shields.io/)
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Project } from '~/core/model/project'
import { Cycle } from '~/core/model/cycle'

let route = new Router({
  prefix: '/shield/:owner/:project'
})

route.get('/*', async (ctx, next) => {
  ctx.project = await Project.findOne({
    'github.owner': ctx.params.owner,
    'github.name': ctx.params.project
  })

  ctx.badge = 'https://img.shields.io/badge'
  ctx.pass = ctx.request.querystring
  if (ctx.pass != "") ctx.pass = '?' + ctx.pass

  if (ctx.project == null) {
    return ctx.redirect(`${ctx.badge}/Houston-invalid-lightgrey.svg${ctx.pass}`)
  }

  await next()
})

route.get('/release.svg', async (ctx) => {
  const release = await ctx.project.getReleased()

  if (release == null) {
    return ctx.redirect(`${ctx.badge}/AppHub-Unreleased-yellow.svg${ctx.pass}`)
  } else {
    return ctx.redirect(`${ctx.badge}/AppHub-${release.version}-green.svg${ctx.pass}`)
  }
})

route.get('/build.svg', async (ctx) => {
  const cycle = await Cycle.findOne({_id: {$in: ctx.project.cycles}})

  if (cycle == null) {
    return ctx.redirect(`${ctx.badge}/Houston-never%20cycled-lightgray.svg${ctx.pass}`)
  }

  const status = await cycle.getStatus()

  switch (status) {
    case ('QUEUE'):
      return ctx.redirect(`${ctx.badge}/Houston-waiting-yellow.svg${ctx.pass}`)
    case ('PRE'):
    case ('POST'):
      return ctx.redirect(`${ctx.badge}/Houston-testing-yellow.svg${ctx.pass}`)
    case ('BUILD'):
      return ctx.redirect(`${ctx.badge}/Houston-building-green.svg${ctx.pass}`)
    case ('REVIEW'):
      return ctx.redirect(`${ctx.badge}/Houston-reviewing-blue.svg${ctx.pass}`)
    case ('FAIL'):
      return ctx.redirect(`${ctx.badge}/Houston-failing-red.svg${ctx.pass}`)
    case ('FINISH'):
      return ctx.redirect(`${ctx.badge}/Houston-passing-brightgreen.svg${ctx.pass}`)
  }
})

export const Route = route
