/**
 * service/github.js
 * Handles all communication with GitHub api
 *
 * @exports {Class} ServiceError - error related to communication with GitHub
 */

import fs from 'fs'
import jwt from 'jsonwebtoken'
import moment from 'moment'

import * as service from './index'
import config from 'lib/config'
import log from 'lib/log'

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
export async function generateJWT (exp = moment().add(2, 'minutes').toDate()) {
  if (exp.toDate == null) {
    log.warn('GitHub service tried generating JWT without an expiration date')
    throw new GitHubError('Unable to generate JWT without expiration date')
  }
  if (typeof config.github.integration.id === 'number') {
    log.warn('GitHub configuration does not include an integration id')
    throw new GitHubError('Unable to generate JWT without integration id')
  }

  const key = await new Promise((resolve, reject) => {
    log.debug('GitHub service is reading integration key')
    fs.readFile(config.github.integration.key, (err, data) => {
      if (err) return reject(err)
      return resolve(data)
    })
  })

  const payload = {
    iat: new Date().getTime(),
    exp: exp.getTime(),
    iss: config.github.integration.id
  }

  return new Promise((resolve, reject) => {
    log.debug('GitHub service is generating a new JWT token')
    jwt.sign(payload, key, 'RS256', (err, token) => {
      if (err) return reject(err)
      return resolve(token)
    })
  })
}
