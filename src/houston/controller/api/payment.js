/**
 * houston/controller/api/payment.js
 * Creates payments with stripe
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import { nameify } from './helpers'
import APIError from './error'
import Project from 'houston/model/project'

const route = new Router({
  prefix: '/payment'
})

// Checks for project existance in database when a payment paramiter is in url
route.param('project', async (n, ctx, next) => {
  let name = 'Unknown'
  try {
    name = nameify(n)
  } catch (err) {
    throw new APIError.FromParameter(400, 'Invalid Project Name', 'project')
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
