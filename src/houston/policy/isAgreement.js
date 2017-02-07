/**
 * houston/policy/isAgreement.js
 * Tests current user's acceptence of the TOS agreement
 * @flow
 *
 * @exports {Function} - Koa route middleware
 */

import koa from 'koa'

import { PermissionAgreementError } from 'lib/error/permission'

/**
 * Checks user agreement notify property
 *
 * @param {Object} ctx - Koa ctx object
 * @param {Function} next - Next function in the chain
 *
 * @returns {Void} - runs next()
 */
export default (ctx: koa.Context, next: koa.Middleware) => {
  if (!ctx.isAuthenticated() || ctx.state.user == null) {
    ctx.session.originalUrl = ctx.request.url
    return ctx.redirect('/auth/github')
  }

  if (ctx.state.user.notify.agreement === false) {
    return next()
  }

  throw new PermissionAgreementError(ctx.state.user)
}
