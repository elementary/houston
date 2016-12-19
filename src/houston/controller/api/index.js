/**
 * houston/controller/api/index.js
 * Welcome to the wonderful world of JSON apis
 *
 * @see http://jsonapi.org/
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import APIError from './error'
import Log from 'lib/log'

import payment from './payment'
import popularity from './popularity'
import projects from './projects'

const log = new Log('controller:api')
const route = new Router({
  prefix: '/api'
})

/**
 * ANY /api/*
 * Adds some common things like links types to any API request.
 */
route.use(async (ctx, next) => {
  await next()

  ctx.type = 'application/vnd.api+json'

  if (ctx.body == null) ctx.body = {}

  if (ctx.body['links'] == null) ctx.body['links'] = {}
  if (ctx.body['links']['self'] == null) ctx.body['links']['self'] = ctx.request.href

  if (ctx.body['jsonapi'] == null) ctx.body['jsonapi'] = {}
  if (ctx.body['jsonapi']['version'] == null) ctx.body['jsonapi']['version'] = '1.0'
})

/**
 * ANY /api/*
 * Handles any errors that occur in the API routes, and converts them to JSON
 * API output
 */
route.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    let apierr = null

    if (err instanceof APIError) {
      apierr = err
    } else {
      log.error(`Error while processing API route ${ctx.request.href}`)
      log.error(err)
      log.report(err, {
        url: ctx.request.href
      })

      apierr = new APIError(500, 'Internal Server Error')
    }

    ctx.status = apierr.status
    ctx.body = { errors: [apierr.toAPI()] }
    return
  }
})

/**
 * ANY /api/*
 * Does header checks for all incoming requests
 */
route.use((ctx, next) => {
  if (ctx.request.is('application/vnd.api+json') === false) {
    throw new APIError(415, 'Invalid Request', 'Request needs to be "application/vnd.api+json"')
  }

  if (ctx.request.accepts('application/vnd.api+json') !== 'application/vnd.api+json') {
    throw new APIError(406, 'Invalid Request', 'Request needs to accept "application/vnd.api+json"')
  }

  return next()
})

// Load all api paths here
route.use(payment.routes(), payment.allowedMethods())
route.use(popularity.routes(), popularity.allowedMethods())
route.use(projects.routes(), projects.allowedMethods())

/**
 * ANY /api/*
 * 404 page for api urls
 */
route.all('*', () => {
  throw new APIError(404, 'Endpoint Not Found')
})

export default route
