/**
 * houston/policy/ifRole.js
 * Tests current user's right for use in if statement
 *
 * @exports {Function} - Checks user rights
 */

import { schema } from 'lib/database/user'
import config from 'lib/config'
import Log from 'lib/log'
import Mistake from 'lib/mistake'

const log = new Log('policy')

/**
 * Checks user rights
 *
 * @param {Object} user - user model from database
 * @param {String|Number} role - role to check against
 * @returns {Boolean} - does the user have or is greater than requested role
 */
export default (user, role) => {
  const possibilities = schema.tree.right.enum
  const userRole = possibilities.indexOf(user.right)

  if (typeof role === 'string') {
    role = possibilities.indexOf(role.toUpperCase())
  }

  if (role > possibilities.length || role < 0) {
    throw new Mistake(500, `Invalid isRole policy of ${role}`)
  }

  if (!config.rights) {
    log.debug(`User rights disabled, letting ${user.username} access "${possibilities[role]}" section`)
    return true
  }

  if (userRole >= role) {
    log.debug(`${user.username} is a "${possibilities[userRole]}", allowing access to "${possibilities[role]}" section`)
    return true
  }

  log.debug(`${user.username} is a "${possibilities[userRole]}", denying access to "${possibilities[role]}" section`)
  return false
}
