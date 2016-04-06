/**
 * houston/controller/hook/github.js
 * Handles all GitHub inputs
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import config from '~/lib/config'
import log from '~/lib/log'

// TODO: GitHub hook integration
const route = new Router({
  prefix: '/github'
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
  if (!config.github.hook) {
    log.info('GitHub is disabled but someone tried to access GitHub hook')
    ctx.status = 500
    ctx.body = 'no'
    return
  } else {
    await next()
  }
})

route.get('/', (ctx) => {
  ctx.body = 'GitHub hook path'
  return
})

route.get('/:key', (ctx) => {
  ctx.body = 'ok'
  return
})

export default route
