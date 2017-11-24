/**
 * houston/controller/api/payment.js
 * Creates payments with stripe
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import { postReceipt } from 'service/mandrill'
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
 * validatePayload
 * Validates a payload of purchase data
 *
 * @param {Function} ControllerError - Factory function for controller errors
 * @param {Project} project - A project to check for
 * @param {Object} data - The sent data
 *
 * @returns {Object} - A collection of clean data to use
 * @returns {Array} - A list of controller errors encountered
 */
const validatePayload = (ControllerError, project, data) => {
  const errors = []
  const payload = {
    token: null,
    amount: null,
    currency: null,
    email: null
  }

  if (data.key == null || data.key === '') {
    errors.push(ControllerError(400, 'key', 'Missing Key'))
  } else if (data.key.startsWith('pk_') === false) {
    errors.push(ControllerError(400, 'key', 'Invalid Key'))
  } else if (data.key !== project.stripe.public) {
    errors.push(ControllerError(400, 'key', 'The given key does not match the one on file'))
  }

  if (data.token == null || data.token === '') {
    errors.push(ControllerError(400, 'token', 'Missing Token'))
  } else if (data.token.startsWith('tok_') === false) {
    errors.push(ControllerError(400, 'token', 'Invalid Token'))
  } else {
    payload.token = data.token
  }

  if (data.amount == null) {
    errors.push(ControllerError(400, 'amount', 'Missing Amount'))
  } else {
    try {
      payload.amount = helper.amountify(data.amount)

      if (payload.amount < 0) {
        errors.push(ControllerError(400, 'amount', 'Amount needs to be a positive integer'))
      } else if (payload.amount < 100) {
        errors.push(ControllerError(400, 'amount', 'Amount needs to be greater than 100'))
      }
    } catch (err) {
      errors.push(ControllerError(400, 'amount', 'Error while converting amount type'))
    }
  }

  if (data.currency == null) {
    errors.push(ControllerError(400, 'currency', 'Missing Currency'))
  } else if (data.currency !== 'USD') {
    errors.push(ControllerError(400, 'currency', 'Only USD currency is allowed'))
  } else {
    payload.currency = data.currency
  }

  if ((data.email != null) && /.+@.+\..+/i.test(data.email)) {
    payload.email = data.email
  }

  return [payload, errors]
}

/**
 * sendReceipt
 * Sends a app purchase receipt
 *
 * @param {Project} project - Project being bought
 * @param {String} email - Email to send
 * @param {Number} amount - The amount the payment was
 * @return {Void}
 */
const sendReceipt = async (project: Project, email: string, amount: number) => {
  log.debug('Sending payment email')

  try {
    await postReceipt(project, email, amount)

    log.debug('Payment email sent')
  } catch (err) {
    log.error(`Unable to send payment email to ${email}`)
    log.error(err)

    log.report(err, {
      project: project.name,
      email,
      amount
    })
  }
}

/**
 * POST /api/payment/:project
 * Creates a new payment for the project
 *
 * @param {String} key - stripe public key for payment
 * @param {String} token - charge token for the payment
 * @param {Number} amount - the amount in cents to charge to the user
 * @param {String} currency - the currency the payment is in
 */
route.post('/:project', async (ctx, next) => {
  if (ctx.request.body == null) return next()
  if (ctx.request.body === '') return next()
  if (typeof ctx.request.body === 'object' && Object.keys(ctx.request.body).length < 1) return next()

  if (ctx.request.body.data == null) {
    throw new error.ControllerPointerError(400, '/data', 'The request does not contain a data object')
  }

  const [payload, errors] = validatePayload((status, key, msg) => {
    return new error.ControllerPointerError(status, `/data/attributes/${key}`, msg)
  }, ctx.project, ctx.request.body.data)

  if (errors.length !== 0) {
    ctx.status = 400
    ctx.body = {
      errors: errors.map((e) => toAPI(e))
    }
    return
  }

  try {
    await stripe.postCharge(ctx.project.stripe.id, payload.token, payload.amount, payload.currency, `Payment for ${ctx.project.name}`)
  } catch (err) {
    log.error(`Error while creating charge for ${ctx.project.name}`)
    log.error(err)
    log.report(err)

    throw err
  }

  ctx.status = 200
  ctx.body = {
    data: {
      name: ctx.github.name,
      key: ctx.project.stripe.public,
      amount: payload.amount
    }
  }

  // This is not called with await, because we want to add it to the executation
  // stack when ever
  if (payload.email != null) {
    sendReceipt(ctx.project, payload.email, payload.amount)
  }
})

/**
 * POST /api/payment/:project
 * Creates a new payment for the project with URL query keys. Used for AppCenter
 *
 * @param {String} key - stripe public key for payment
 * @param {String} token - charge token for the payment
 * @param {Number} amount - the amount in cents to charge to the user
 * @param {String} currency - the currency the payment is in
 */
route.post('/:project', async (ctx) => {
  const [payload, errors] = validatePayload((status, key, msg) => {
    return new error.ControllerParameterError(status, key, msg)
  }, ctx.project, ctx.request.query)

  if (errors.length !== 0) {
    ctx.status = 400
    ctx.body = {
      errors: errors.map((e) => toAPI(e))
    }
    return
  }

  try {
    await stripe.postCharge(ctx.project.stripe.id, payload.token, payload.amount, payload.currency, `Payment for ${ctx.project.name}`)
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
      amount: payload.amount
    }
  }

  // This is not called with await, because we want to add it to the executation
  // stack when ever
  if (payload.email != null) {
    sendReceipt(ctx.project, payload.email, payload.amount)
  }
})

export default route
