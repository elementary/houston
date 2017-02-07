/**
 * houston/policy/isRole.js
 * Tests current user's right for use in middleware
 * @flow
 *
 * @exports {Function} - Koa route middleware
 */

import Koa from 'koa'

import ifRole from './ifRole'
import { PermissionRightError } from 'lib/error/permission'

/**
 * Checks user rights
 *
 * @param {String} role - role to check against
 * @returns {Function} - Koa route middleware
 */
export default (role: string) => {
  return (ctx: Koa.Context, next: Koa.Middleware) => {
    if (!ctx.isAuthenticated()) {
      ctx.session.originalUrl = ctx.request.url
      return ctx.redirect('/auth/github')
    }

    if (ifRole(ctx.state.user, role)) return next()

    throw new PermissionRightError(ctx.state.user, role)
  }
}
