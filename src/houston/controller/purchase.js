/**
 * houston/controller/purchase.js
 * Handles the temporary purchase URL used in Appstream files
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

const route = new Router()

/**
 * GET /project/:stripe
 * Shows an error page because you can't actually purchase things this way
 *
 * @param {String} stripe - Stripe public key for a project
 */
route.get('/purchase/:stripe', (ctx) => {
  ctx.status = 501

  return ctx.render('error', {
    error: {
      status: 501,
      title: 'Purchases are not implemented outside AppCenter'
    }
  })
})

export default route
