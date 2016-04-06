/**
 * core/policy/ifRole.js
 * Tests current user's right for use in if statement
 *
 * @exports {Function} IfRole - Bool returning function
 */

import { Config, Log } from '~/app'
import { UserSchema } from '~/core/model/user'

export function IfRole (user, role) {
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

  // TODO: Don't make this GitHub specific
  let userRole = possibilities.indexOf(user.right)

  if (!Config.rights) return true

  if (userRole >= role) return true

  return false
}
