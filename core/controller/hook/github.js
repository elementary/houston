/**
 * core/controller/hook/github.js
 * Handles all GitHub inputs
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Config, Log } from '~/app'

// TODO: GitHub hook integration
let route = new Router({
  prefix: '/hook/github'
})

// TODO: GitHub key checking
route.param('key', async (key, ctx, next) => {
  if (key !== 'test') {
    ctx.status = 404
    return
  }

  await next()
})

// Logs failed hook and responds when GitHub config is disabled
route.get('*', async (ctx, next) => {
  if (!Config.github.hook) {
    Log.info('GitHub is disabled but someone tried to access GitHub hook')
    ctx.status = 500
    ctx.body = 'no'
    return
  } else {
    await next()
  }
})

route.get('/', ctx => {
  ctx.body = 'GitHub hook path'
  return
})

route.get('/:key', ctx => {
  ctx.body = 'ok'
  return
})

export const Route = route
