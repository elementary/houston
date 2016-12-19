/**
 * houston/controller/api/payment.js
 * Creates payments with stripe
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import { nameify } from './helpers'
import APIError from './error'
import config from 'lib/config'
import Log from 'lib/log'
import Project from 'houston/model/project'

const log = new Log('controller:api:payment')
const route = new Router({
  prefix: '/payment'
})

// Checks that stripe configuration is enabled for any payment endpoint
route.all('*', (ctx, next) => {
  if (
    config.stripe === false ||
    config.stripe.client === false ||
    config.stripe.secret === false ||
    config.stripe.public === false
  ) {
    log.debug('Received a request while disabled. Returning 503')

    throw new APIError(503, 'Service Unavailable')
  }

  return next()
})

// Checks for project existance in database when a payment paramiter is in url
route.param('project', async (n, ctx, next) => {
  let name = null
  try {
    name = nameify(n)
  } catch (err) {
    throw new APIError(400, 'Invalid Project Name')
  }

  if (name == null) {
    throw new APIError(400, 'Invalid Project Name')
  }

  ctx.project = await Project.findOne({ name })

  if (ctx.project == null) {
    throw new APIError(404, 'Project Not Found', `${name} project was not found`)
  }

  if (ctx.project.stripe.enabled === false) {
    throw new APIError(400, 'Project Not Enabled', `${name} project does not have payments enabled`)
  }

  await next()
})

/**
 * GET /api/payment/:project
 * Sends the public data needed to generate a stripe charge
 */
route.get('/:project', async (ctx) => {
  ctx.status = 200
  ctx.body = {
    data: {
      name: ctx.project.name,
      key: ctx.project.stripe.public
    }
  }

  return
})

/**
 * POST /api/payment/:project
 * Creates a new payment for the project
 *
 * @param {String} key - stripe public key for payment
 * @param {String} token - charge token for the payment
 * @param {Number} amount - the amount in cents to charge to the user
 */
route.post('/:project', async (ctx) => {

})

export default route
