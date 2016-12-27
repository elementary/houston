/**
 * houston/controller/agreement.js
 * Handles TOS agreement page things
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as policy from 'houston/policy'

const route = new Router()

/**
 * GET /agreement
 * Shows the TOS agreement page
 */
route.get('/agreement', policy.isRole('BETA'), (ctx) => {
  return ctx.render('agreement')
})

/**
 * GET /agreement/accept
 * Accepts the latest TOS agreement
 */
route.get('/agreement/accept', policy.isRole('BETA'), async (ctx) => {
  ctx.state.user.notify.agreement = false
  await ctx.state.user.save()

  if (ctx.session.originalUrl != null) {
    return ctx.redirect(ctx.session.originalUrl)
  } else {
    return ctx.redirect('/dashboard')
  }
})

export default route
