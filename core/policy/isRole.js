/**
 * core/policy/isRole.js
 * Tests current user's right for use in middleware
 *
 * @exports {Function} IsRole - Koa route middleware
 */

import { Config, Log } from '~/app'
import { UserSchema } from '~/core/model/user'

export function IsRole (role) {
  let possibilities = UserSchema.tree.right.enum

  // TODO: Database lookup?
  if (typeof role === 'string') {
    role = possibilities.indexOf(role)
  }

  if (role > possibilities.length || role < 0) {
    Log.error(`Invalid IsRole policy of ${role} detected`)

    return (ctx, next) => {
      return ctx.throw(500, `Invalid IsRole policy of ${role} at ${ctx.path}`)
    }
  }

  const expPossibilities = possibilities
  const expRole = role

  // TODO: Don't make this GitHub specific
  return (ctx, next, possibilities = expPossibilities, role = expRole) => {
    if (!ctx.isAuthenticated()) {
      ctx.session.originalUrl = ctx.request.url
      return ctx.redirect('/auth/github')
    }

    let userRole = possibilities.indexOf(ctx.user.right)
    Log.silly(`${ctx.user.username} is level ${userRole} trying to access level ${role}`)

    if (!Config.rights) {
      return next()
    }

    if (userRole >= role) {
      Log.silly(`${ctx.state.user.username} may pass unharmed`)
      return next()
    }

    if (role === possibilities.indexOf('BETA')) {
      Log.silly(`${ctx.user.username} is not beta enough`)
      return ctx.render('error', {
        message: 'Houston is currently only avalible to beta testers'
      })
    }

    Log.silly(`${ctx.user.username} shall not pass`)
    return ctx.render('error', {
      message: 'You shall not pass!'
    })
  }
}
