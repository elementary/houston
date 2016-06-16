/**
 * houston/controller/hook/github.js
 * Handles all GitHub inputs
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import config from '~/lib/config'

// TODO: GitHub hook integration
const route = new Router({
  prefix: '/github/:key'
})

// TODO: GitHub key checking
route.param('key', async (key, ctx, next) => {
  if (key !== 'test') {
    throw new ctx.Mistake(404)
  }

  await next()
})

// Logs failed hook and responds when GitHub config is disabled
route.get('*', async (ctx, next) => {
  if (!config.github.hook) {
    throw new ctx.Mistake(503)
  } else {
    await next()
  }
})

route.get('/', (ctx) => {
  ctx.body = 'GitHub hook path'
  return
})

export default route
