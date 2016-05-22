/**
 * houston/controller/hook/index.js
 * Handles all outside service inputs
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import aptly from './aptly'
import github from './github'

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
    ctx.status = 500
    return
  }

  return
})

route.use(aptly.routes(), aptly.allowedMethods())
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
require('./strongback')

export default route
