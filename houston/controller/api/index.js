/**
 * houston/controller/api/index.js
 * Welcome to the wonderful world of JSON apis
 *
 * @see http://jsonapi.org/
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import log from '~/lib/log'
import Mistake from '~/lib/mistake'

const route = new Router({
  prefix: '/api'
})

/**
 * /api/*
 * Does header checks and sets for all api calls
 */
route.use(async (ctx, next) => {
  if (ctx.request.header['content-type'] == null || ctx.request.header['content-type'] !== 'application/vnd.api+json') {
    ctx.status = 415
    return
  }

  if (ctx.request.header['accept'] == null || ctx.request.header['accept'].split(',').indexOf('application/vnd.api+json') === -1) {
    ctx.status = 406
    return
  }

  try {
    await next()
  } catch (err) {
    if (err.status == null || err.status[0] >= 5) log.error(err)

    if (err.mistake && err.expose) {
      ctx.status = err.status
      ctx.body = { errors: [{
        status: err.status,
        title: err.message
      }]}
    } else {
      ctx.status = 500
      ctx.body = { errors: [{
        status: 500,
        title: 'Houston has encountered an error'
      }]}
    }
  }

  if (ctx.body != null && ctx.body['links'] == null) ctx.body['links'] = {}

  if (ctx.body != null && ctx.body['links']['self'] == null) ctx.body['links']['self'] = ctx.request.url

  ctx.type = 'application/vnd.api+json'
  return
})

/**
 * /api/*
 * 404 page for api urls
 */
route.all('*', (ctx) => {
  throw new Mistake(404, 'Page not found', true)
  return
})

export default route
