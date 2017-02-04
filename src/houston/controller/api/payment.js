/**
 * houston/controller/api/payment.js
 * Creates payments with stripe
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import { toAPI } from './error'
import * as error from 'lib/error/controller'
import * as helper from './helpers'
import * as stripe from 'service/stripe'
import config from 'lib/config'
import Log from 'lib/log'
import Project from 'lib/database/project'

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

    throw new error.ControllerError(503, 'Service Unavailable')
  }

  return next()
})

// Checks for project existance in database when a payment paramiter is in url
route.param('project', async (n, ctx, next) => {
  let name = null
  try {
    name = helper.nameify(n)
  } catch (err) {
    throw new error.ControllerParameterError(400, 'project', 'Invalid project name')
  }

  if (name == null) {
    throw new error.ControllerParameterError(400, 'project', 'Invalid project name')
  }

  ctx.project = await Project.findOne({ name })

  if (ctx.project == null) {
    throw new error.ControllerParameterError(404, 'project', `${name} project was not found`)
  }

  if (ctx.project.stripe.enabled === false) {
    throw new error.ControllerParameterError(400, 'project', `${name} project does not have payments enabled`)
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
 * @param {String} currency - the currency the payment is in
 */
route.post('/:project', async (ctx) => {
  if (ctx.request.body.data == null) {
    throw new error.ControllerPointerError(400, '/data', 'The request does not contain a data object')
  }

  const errors = []

  let token = null
  let amount = null
  let currency = null

  if (ctx.request.body.data.key == null || ctx.request.body.data.key === '') {
    errors.push(new error.ControllerPointerError(400, '/data/attributes/key', 'Missing Key'))
  } else if (ctx.request.body.data.key.startsWith('pk_') === false) {
    errors.push(new error.ControllerPointerError(400, '/data/attributes/key', 'Invalid Key'))
  } else if (ctx.request.body.data.key !== ctx.project.stripe.public) {
    errors.push(new error.ControllerPointerError(400, '/data/attributes/key', 'The given key does not match the one on file'))
  }

  if (ctx.request.body.data.token == null || ctx.request.body.data.token === '') {
    errors.push(new error.ControllerPointerError(400, '/data/attributes/token', 'Missing Token'))
  } else if (ctx.request.body.data.token.startsWith('tok_') === false) {
    errors.push(new error.ControllerPointerError(400, '/data/attributes/token', 'Invalid Token'))
  } else {
    token = ctx.request.body.data.token
  }

  if (ctx.request.body.data.amount == null) {
    errors.push(new error.ControllerPointerError(400, '/data/attributes/amount', 'Missing Amount'))
  } else {
    try {
      amount = helper.amountify(ctx.request.body.data.amount)

      if (amount < 0) {
        errors.push(new error.ControllerPointerError(400, '/data/attributes/amount', 'Amount needs to be a positive integer'))
      } else if (amount < 100) {
        errors.push(new error.ControllerPointerError(400, '/data/attributes/amount', 'Amount needs to be greater than 100'))
      }
    } catch (err) {
      errors.push(new error.ControllerPointerError(400, '/data/attributes/amount', 'Error while converting'))
    }
  }

  if (ctx.request.body.data.currency == null) {
    errors.push(new error.ControllerPointerError(400, '/data/attributes/currency', 'Missing Currency'))
  } else if (ctx.request.body.data.currency !== 'USD') {
    errors.push(new error.ControllerPointerError(400, '/data/attributes/currency', 'Only USD currency is allowed'))
  } else {
    currency = ctx.request.body.data.currency
  }

  if (errors.length !== 0) {
    ctx.status = 400
    ctx.body = {
      errors: errors.map((e) => toAPI(e))
    }
    return
  }

  try {
    await stripe.postCharge(ctx.project.stripe.id, token, amount, currency, `Payment for ${ctx.project.name}`)
  } catch (err) {
    log.error(`Error while creating charge for ${ctx.project.name}`)
    log.error(err)
    log.report(err)

    throw err
  }

  ctx.status = 200
  ctx.body = {
    data: {
      name: ctx.project.name,
      key: ctx.project.stripe.public,
      amount
    }
  }
})

export default route
