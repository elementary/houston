/**
 * houston/controller/api/index.js
 * Welcome to the wonderful world of JSON apis
 *
 * @see http://jsonapi.org/
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import { ControllerError } from 'lib/error/controller'
import { toAPI } from './error'
import config from 'lib/config'

import downloads from './downloads'
import list from './list'
import payment from './payment'

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

  if (ctx.body['meta'] == null) ctx.body['meta'] = {}
  if (ctx.body['meta']['date'] == null) ctx.body['meta']['date'] = new Date().toISOString()
  if (ctx.body['meta']['version'] == null) ctx.body['meta']['version'] = config.houston.version
  if (ctx.body['meta']['environment'] == null) ctx.body['meta']['environment'] = config.env
  if (ctx.body['meta']['commit'] == null && config.houston.commit !== '.gitless') ctx.body['meta']['commit'] = config.houston.commit

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
    ctx.app.emit('error', err, ctx)

    const API = toAPI(err)

    ctx.status = API.status
    ctx.body = { errors: [API] }
  }
})

/**
 * ANY /api/*
 * Does header checks for all incoming requests
 */
route.use((ctx, next) => {
  if (ctx.request.is('application/vnd.api+json') === false) {
    throw new ControllerError(415, 'Request needs to be "application/vnd.api+json"')
  }

  if (ctx.request.accepts('application/vnd.api+json') !== 'application/vnd.api+json') {
    throw new ControllerError(406, 'Request needs to accept "application/vnd.api+json"')
  }

  return next()
})

// Load all api paths here
route.use(downloads.routes(), downloads.allowedMethods())
route.use(list.routes(), list.allowedMethods())
route.use(payment.routes(), payment.allowedMethods())

/**
 * ANY /api/*
 * 404 page for api urls
 */
route.all('*', () => {
  throw new ControllerError(404, 'Endpoint not found')
})

export default route
