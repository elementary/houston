/**
 * houston/controller/hook/index.js
 * Handles all outside service inputs
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import github from './github'
import Log from 'lib/log'

const log = new Log('controller:hook')
const route = new Router({
  prefix: '/hook'
})

/**
 * /hook/*
 * Catch all to return simple 500 status on failure
 */
route.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    log.error(err)

    ctx.status = 500
    return
  }

  return
})

route.use(github.routes(), github.allowedMethods())

/**
 * /hook/*
 * 404 page for api urls
 */
route.all('*', (ctx) => {
  ctx.status = 404
  return
})

// Use event hook listeners as well
require('./flightcheck')

export default route
