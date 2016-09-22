/**
 * service/github.js
 * Handles all communication with GitHub api
 *
 * @exports {Class} ServiceError - error related to communication with GitHub
 */

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
