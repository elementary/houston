/**
 * houston/policy/ifRole.js
 * Tests current user's right for use in if statement
 *
 * @exports {Function} - Checks user rights
 */

import { schema } from 'lib/database/user'
import config from 'lib/config'
import Log from 'lib/log'

const log = new Log('policy:ifRole')
const possibilities = schema.tree.right.enum

/**
 * Checks user rights
 *
 * @param {Object} user - user model from database
 * @param {String} role - role to check against
 * @returns {Boolean} - does the user have or is greater than requested role
 */
export default (user, role) => {
  const userRole = possibilities.indexOf(user.right)
  const needRole = possibilities.indexOf(role.toUpperCase())

  // a super failsafe for permissions in case of an invalid role given
  if (needRole < 0 || needRole > possibilities.length - 1) {
    log.error(`Invalid user role "${role}", denying all access!`)
    return false
  }

  if (!config.rights) {
    log.debug(`User rights disabled, allowing ${user.username} access to "${possibilities[needRole]}" section`)
    return true
  }

  if (userRole >= needRole) {
    log.debug(`${user.username} is a "${possibilities[userRole]}", allowing access to "${possibilities[needRole]}" section`)
    return true
  }

  log.debug(`${user.username} is a "${possibilities[userRole]}", denying access to "${possibilities[needRole]}" section`)
  return false
}
