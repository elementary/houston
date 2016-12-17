/**
 * houston/policy/isRole.js
 * Tests current user's right for use in middleware
 *
 * @exports {Function} - Koa route middleware
 */

import ifRole from './ifRole'
import PermError from './error'

/**
 * Checks user rights
 *
 * @param {String} role - role to check against
 * @returns {Function} - Koa route middleware
 */
export default (role) => {
  return (ctx, next) => {
    if (!ctx.isAuthenticated()) {
      ctx.session.originalUrl = ctx.request.url
      return ctx.redirect('/auth/github')
    }

    if (ifRole(ctx.user, role)) return next()

    throw new PermError.FromRight(ctx.state.user, role)
  }
}
