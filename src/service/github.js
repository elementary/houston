/**
 * service/github.js
 * Handles all communication with GitHub api
 *
 * @exports {Class} ServiceError - error related to communication with GitHub
 */

import moment from 'moment'

import * as service from './index'

/**
 * githubGitHubErrorError
 * a specific error related to communication with GitHub
 *
 * @extends ServiceError
 */
export class GitHubError extends service.ServiceError {

  /**
   * Creates a new GitHubError
   *
   * @param {String} msg - message to put on the error
   */
  constructor (msg) {
    super(msg)

    this.code = 'GTHERR'
  }
}

/**
 * generateJWT
 * Generates JWT bearer token for GitHub authentication
 *
 * @param {Date} exp - date to expire on
 * @returns {String} - JWT bearer token to authenticate with
 */
export function generateJWT (exp = moment().add(1, 'hours').toDate()) {
  if (exp.toDate == null) throw new GitHubError('Unable to generate JWT without expiration date')


}
