/**
 * houston/policy/ifMember.js
 * Tests current user's GitHub access to repository
 *
 * @exports {Function} - Checks user rights against GitHub
 */

import * as github from '~/houston/service/github'
import config from '~/lib/config'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'

/**
 * Checks user rights against GitHub
 *
 * @param {Object} project - Database object of project
 * @param {Object} user - Database object of user
 * @returns {Boolean} - true if the user have access to repository
 */
export default function (project, user) {
  if (project.github == null) {
    throw new Mistake(500, 'Project has no github data for ifMember check')
  }
  if (user.github == null) {
    throw new Mistake(500, 'User has no github data for ifMember check')
  }

  if (!config.rights) {
    log.debug(`User rights disabled, letting ${user.username} access ${project.name} section`)
    return true
  }

  return github.getPermission(project.github.owner, project.github.name, user.username, user.github.access)
}
