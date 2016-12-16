/**
 * houston/policy/isRole.js
 * Tests current user's right for use in middleware
 *
 * @exports {Function} - Koa route middleware
 */

import { schema } from 'houston/model/user'
import ifRole from './ifRole'

/**
 * Checks user rights
 *
 * @param {String|Number} role - role to check against
 * @returns {Function} - Koa route middleware
 */
export default (role) => {
  return (ctx, next) => {
    if (!ctx.isAuthenticated()) {
      ctx.session.originalUrl = ctx.request.url
      return ctx.redirect('/auth/github')
    }

    if (ifRole(ctx.state.user, role)) return next()
    const possibilities = schema.tree.right.enum

    if (role === possibilities.indexOf('BETA')) {
      throw new ctx.Mistake(403, 'Houston is currently in beta')
    }

    throw new ctx.Mistake(403, 'You shall not pass')
  }
}
