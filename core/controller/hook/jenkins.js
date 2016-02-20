/**
 * core/controller/hook/jenkins.js
 * Handles all Jenkins inputs
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Config, Log } from '~/app'

let route = new Router({
  prefix: '/hook/jenkins/:key'
})

route.param('key', async (key, ctx, next) => {
  if (!Config.jenkins) {
    Log.debug('Jenkins is disabled but someone tried to access Jenkins hook')
    return ctx.throw('Jenkins is on vacation right now', 404)
  } else if (key !== Config.jenkins.public) {
    Log.debug('Someone tried to connect to Jenkins with an incorrect key')
    return ctx.throw('Nobody can replace Mr. Jenkins', 404)
  }

  await next()
})

route.get('/', ctx => {
  ctx.body = 'whoop'
  return
})

export const Route = route
