/**
 * houston/policy/ifMember.js
 * Tests current user's GitHub access to repository
 * @flow
 *
 * TODO: database models with flow
 *
 * @exports {Function} - Checks user rights against GitHub
 */

import { ApplicationError } from 'lib/error/application'
import { getPermission } from 'service/github'
import config from 'lib/config'
import Log from 'lib/log'

const log = new Log('policy:ifMember')

/**
 * Checks user rights against GitHub
 *
 * @param {Object} project - Database object of project
 * @param {Object} user - Database object of user
 * @returns {Boolean} - true if the user have access to repository
 */
export default function (project: Object, user: Object) {
  if (project == null) {
    log.warn('No project given. Denying access.')
    throw new ApplicationError('Invalid project for authentication')
  }
  if (project.github == null) {
    log.warn(`${project.name} has no GitHub data to authenticate against. Denying access.`)
    throw new ApplicationError('Project has no GitHub data')
  }
  if (user.github == null) {
    log.warn(`${user.username} has no GitHub data to authenticate against. Denying access.`)
    throw new ApplicationError('User has no GitHub data')
  }

  if (!config.rights) {
    log.debug(`User rights disabled, allowing ${user.username} to access ${project.name} project`)
    return true
  }

  return getPermission(project.github.owner, project.github.name, user.username, user.github.access)
}
