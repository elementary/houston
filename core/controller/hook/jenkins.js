/**
 * core/controller/hook/jenkins.js
 * Handles all Jenkins inputs
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Config, Log } from '~/app'

// TODO: Jenkins hook integration
let route = new Router({
  prefix: '/hook/jenkins'
})

// TODO: Jenkins key checking
route.param('key', (key, ctx, next) => {
  if (key !== Config.jenkins.public) {
    ctx.status = 404
    return
  }

  return next()
})

// Logs failed hook and responds when jenkins config is disabled
route.get('*', async (ctx, next) => {
  if (!Config.jenkins) {
    Log.debug('Jenkins is disabled but someone tried to access Jenkins hook')
    ctx.status = 500
    ctx.body = 'no'
    return
  } else {
    await next()
  }
})

route.get('/:key', ctx => {
  ctx.body = 'ok'
})

export const Route = route
