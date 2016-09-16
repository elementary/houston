/**
 * houston/controller/api/index.js
 * Welcome to the wonderful world of JSON apis
 *
 * @see http://jsonapi.org/
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import log from 'lib/log'
import Mistake from 'lib/mistake'
import popularity from './popularity'
import projects from './projects'

const route = new Router({
  prefix: '/api'
})

/**
 * /api/*
 * Does header checks and sets for all api calls
 */
route.use(async (ctx, next) => {
  if (ctx.request.is('application/vnd.api+json') === false) {
    ctx.status = 415
    return
  }

  if (ctx.request.accepts('application/vnd.api+json') !== 'application/vnd.api+json') {
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

  if (ctx.body != null && ctx.body['links']['self'] == null) ctx.body['links']['self'] = ctx.request.href

  ctx.type = 'application/vnd.api+json'
  return
})

// Load all api paths here
route.use(popularity.routes(), popularity.allowedMethods())
route.use(projects.routes(), projects.allowedMethods())

/**
 * /api/*
 * 404 page for api urls
 */
route.all('*', (ctx) => {
  throw new Mistake(404, 'Page not found', true)
})

export default route
