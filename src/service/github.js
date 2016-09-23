/**
 * service/github.js
 * Handles all communication with GitHub api
 * NOTE: This file uses GitHub early-access integrations. Things may change
 * NOTE: GitHub api requires the use of a custom `Accept` header while in early-access
 *
 * @exports {Class} ServiceError - error related to communication with GitHub
 */

import fs from 'fs'
import jwt from 'jsonwebtoken'
import moment from 'moment'

import * as service from './index'
import config from 'lib/config'
import log from 'lib/log'
import request from 'lib/request'

// This is a poor man's cache for GitHub authentication tokens
const tokenCache = []

/**
 * getToken
 * Returns a token from the cache or null if it does not exist
 *
 * @param {Number} [user] - optional GitHub user id
 * @return {String} - GitHub token or null for non-existant
 */
const getToken = (user) => {
  const foundIndex = tokenCache.findIndex((a) => (a.user === user))

  // Remove anything that is less than one minute to expire
  if (foundIndex !== -1 && tokenCache[foundIndex].exp.getTime() > Date.now() + 1000) {
    delete tokenCache[foundIndex]
    return null
  }

  if (foundIndex !== -1) return tokenCache[foundIndex]
  return null
}

/**
 * setToken
 * Saves a token in the cache
 *
 * @param {String} token - GitHub authentication token
 * @param {Date} exp - the date it expires
 * @param {Number} [user] - the GitHub user id
 * @returns {Void}
 */
const setToken = (token, exp, user) => {
  if (typeof token !== 'string') {
    throw new GitHubError('Unable to setToken without a token parameter')
  }
  if (typeof exp.getTime !== 'function') {
    throw new GitHubError('Unable to setToken without a exp parameter')
  }

  tokenCache.push({ token, exp, user })
}

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
 * @param {Date} [exp=1 minute from now] - date to expire on
 * @returns {String} - JWT bearer token to authenticate with
 */
export async function generateJWT (exp = moment().add(1, 'minutes').toDate()) {
  if (typeof exp.getTime !== 'function') {
    log.warn('GitHub service tried generating JWT without an expiration date')
    throw new GitHubError('Unable to generate JWT without expiration date')
  }
  if (typeof config.github.integration.id !== 'number') {
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

  // All dates should be unix epoch in seconds (not milliseconds)
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(exp.getTime() / 1000),
    iss: config.github.integration.id
  }

  return new Promise((resolve, reject) => {
    log.debug('GitHub service is generating a new JWT token')
    jwt.sign(payload, key, { algorithm: 'RS256' }, (err, token) => {
      if (err) return reject(err)
      return resolve(token)
    })
  })
}

/**
 * generateToken
 * Generates GitHub authentication token
 *
 * @param {Number} [user] - optional GitHub user id to generate token on behalf of
 * @returns {String} - GitHub token to use for authentication
 */
export async function generateToken (user) {
  if (typeof config.github.integration.id !== 'number') {
    log.warn('GitHub configuration does not include an integration id')
    throw new GitHubError('Unable to generate JWT without integration id')
  }

  const cachedToken = getToken(user)
  if (cachedToken != null) return cachedToken.token

  const JWT = await generateJWT()

  const githubReq = request
  .post(`https://api.github.com/installations/${config.github.integration.id}/access_tokens`)
  .set('Accept', 'application/vnd.github.machine-man-preview+json')
  .set('Authorization', `Bearer ${JWT}`)

  if (user != null) {
    log.debug(`GitHub service is generating a token for user ${user}`)
    githubReq.send({ 'user_id': user })
  }

  const githubRes = await githubReq
  .catch((err) => {
    log.error(`Trying to generate GitHub token returned a ${err.status}`)
    throw new GitHubError('Unable to generate authentication token')
  })

  if (githubRes.body != null && githubRes.body.token != null) {
    setToken({
      token: githubRes.body.token,
      exp: moment(githubRes.body.expires_at).toDate(),
      user
    })

    return githubRes.body.token
  } else {
    log.error('GitHub token generation returned an unexpected body')
    throw new GitHubError('Unable to generate authentication token')
  }
}
