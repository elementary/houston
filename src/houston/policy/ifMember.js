/**
 * houston/policy/ifMember.js
 * Tests current user's GitHub access to repository
 *
 * @exports {Function} - Checks user rights against GitHub
 */

import { getPermission } from 'service/github'
import config from 'lib/config'
import Log from 'lib/log'
import PermError from './error'

const log = new Log('policy:ifMember')

/**
 * Checks user rights against GitHub
 *
 * @param {Object} project - Database object of project
 * @param {Object} user - Database object of user
 * @returns {Boolean} - true if the user have access to repository
 */
export default function (project, user) {
  if (project.github == null) {
    log.warn(`${project.name} has no GitHub data to authenticate against. Denying access.`)
    throw new PermError.FromAccess(user)
  }
  if (user.github == null) {
    log.warn(`${user.username} has no GitHub data to authenticate against. Denying access.`)
    throw new PermError.FromAccess(user)
  }

  if (!config.rights) {
    log.debug(`User rights disabled, allowing ${user.username} to access ${project.name} project`)
    return true
  }

  return getPermission(project.github.owner, project.github.name, user.username, user.github.access)
}
