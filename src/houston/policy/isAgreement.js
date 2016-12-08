/**
 * houston/policy/isAgreement.js
 * Tests current user's acceptence of the TOS agreement
 *
 * @exports {Function} - Koa route middleware
 */

/**
 * Checks user agreement notify property
 *
 * @param {Object} ctx - Koa ctx object
 * @param {Function} next - Next function in the chain
 *
 * @returns {Void} - runs next()
 */
export default (ctx, next) => {
  if (!ctx.isAuthenticated() || ctx.user == null) {
    ctx.session.originalUrl = ctx.request.url
    return ctx.redirect('/auth/github')
  }

  if (ctx.user.notify.agreement === false) {
    return next()
  }

  return ctx.redirect('/agreement')
}
