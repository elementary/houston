/**
 * service/github.js
 * Handles all communication with GitHub api
 * NOTE: This file uses GitHub early-access integrations. Things may change
 * NOTE: GitHub api requires the use of a custom `Accept` header while in early-access
 *
 * @exports {Object} default - superagent for communicating with GitHub
 * @exports {Class} GitHubError - error related to communication with GitHub
 * @exports {Function} castProject - Casts a GitHub project for internal use.
 * @exports {Function} castRelease - Casts a GitHub release for internal use
 * @exports {Function} generateJWT - Generates JWT bearer token
 * @exports {Function} generateToken - Generates GitHub authentication token
 * @exports {Function} getRepos - Fetches all repos the token has access to
 * @exports {Function} getReleases - Fetches all releases a repo has
 * @exports {Function} getPermission - Checks callaborator status on repository
 * @exports {Function} postLabel - Creates a label on GitHub repository
 * @exports {Function} postIssue - Creates an issue on GitHub repository
 * @exports {Function} postFile - Creates a file for a release asset
 */

import fs from 'fs'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import semver from 'semver'

import { domain, pagination } from 'lib/request'
import * as service from './index'
import config from 'lib/config'
import Log from 'lib/log'

const log = new Log('service:github')

const api = domain('https://api.github.com')
.use((req) => {
  req.set('Accept', 'application/vnd.github.machine-man-preview+json')
  req.set('User-Agent', 'elementary-houston')
})

export default api

// This is a poor man's cache for GitHub authentication tokens
const tokenCache = []

/**
 * getToken
 * Returns a token from the cache or null if it does not exist
 *
 * @param {Number} inst - GitHub organization integration ID
 * @param {Number} [user] - optional GitHub user id
 * @return {String} - GitHub token or null for non-existant
 */
const getToken = (inst, user = null) => {
  const foundIndex = tokenCache.findIndex((a) => {
    return (a.inst === inst && a.user === user)
  })

  // Remove anything that is less than one minute to expire
  if (foundIndex !== -1 && tokenCache[foundIndex].exp.getTime() < Date.now() + 1000) {
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
 * @param {Number} inst - GitHub organization integration ID
 * @param {String} token - GitHub authentication token
 * @param {Date} exp - the date it expires
 * @param {Number} [user] - the GitHub user id
 * @throws {GitHubError} - invalid arguments
 * @returns {Void}
 */
const setToken = (inst, token, exp, user = null) => {
  if (typeof token !== 'string') {
    throw new GitHubError('Unable to setToken without a token parameter')
  }
  if (typeof exp.getTime !== 'function') {
    throw new GitHubError('Unable to setToken without a exp parameter')
  }

  tokenCache.push({ inst, token, exp, user })
}

/**
 * GitHubError
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
 * paramAssert
 * Checks function paramiters
 *
 * @param {*} val - value to assert
 * @param {String} type - javascript typeof value to check for
 * @param {String} fn - function name
 * @param {String} name - value name to put in log
 * @throws {GitHubError} - value does not pass assert check
 * @returns {Void}
 */
const paramAssert = (val, type, fn, name) => {
  if (typeof val !== type) {
    log.error(`GitHub service tried to ${fn} without a ${name}`)
    throw new GitHubError(`Unable to ${fn} without a ${name}`)
  }
}

/**
 * errorCheck
 * Checks generatic GitHub status codes for a more descriptive error
 *
 * @param {Error} err - superagent error to check
 * @param {Object} [res] - GitHub response object
 * @param {String} fn - function name on error
 * @param {String} [fo] - additional info to put in error for tracking
 * @returns {GitHubError} - a parsed error from GitHub
 */
const errorCheck = (err, res, fn, fo) => {
  const errorString = `on GitHub service ${(fo != null) ? `${fn} for ${fo}` : fn}`

  if (err.status === 401) {
    log.info(`Bad credentials ${errorString}`)
    return new GitHubError('Bad GitHub credentials')
  }

  if (err.status === 403) {
    log.warn('Exceeding maximum number of authentication calls to GitHub')
    return new GitHubError('Exceeding maximum number of authentication calls to GitHub')
  }

  if (res != null && res.header != null && res.header['x-ratelimit-remaining'] < 10) {
    log.warn(`Rate limit remaining is at ${res.header['x-ratelimit-remaining']}`)
    return new GitHubError('Low rate limit remaning')
  }

  if (res != null && res.body != null && res.body.message != null) {
    log.error(`${res.body.message} ${errorString}`)
    return new GitHubError('A GitHub error occured')
  }

  if (res != null && res.status != null) {
    log.error(`${res.status} ${errorString}`, err)
    return new GitHubError(`GitHub ${res.status} error`)
  }

  log.error(`Error occured ${errorString}`, err)
  return new GitHubError('An error occured')
}

/**
 * castProject
 * Casts a GitHub project to a simpler object for internal use
 *
 * @param {Object} project - GitHub API project object
 * @param {Number} [installation] - GitHub installation number
 * @returns {Object} - a mapped project object
 */
export function castProject (project, installation) {
  const owner = service.nameify(project.owner.login)
  const repo = service.nameify(project.name)

  return {
    name: `com.github.${owner}.${repo}`,
    repo: project.git_url,
    tag: project.default_branch,
    github: {
      id: project.id,
      owner: project.owner.login,
      name: project.name,
      private: project.private,
      installation
    }
  }
}

/**
 * castRelease
 * Casts a GitHub release to a simpler object for internal use
 *
 * @param {Object} release - GitHub API release object
 * @returns {Object} - a mapped release object
 */
export function castRelease (release) {
  const version = semver.valid(release.tag_name)

  return {
    version,
    changelog: release.body.match(/.+/g),
    github: {
      id: release.id,
      author: release.author.login,
      date: new Date(release.published_at),
      tag: release.tag_name
    },
    date: {
      released: new Date(release.published_at)
    }
  }
}

/**
 * generateJWT
 * Generates JWT bearer token for GitHub authentication
 *
 * @see https://developer.github.com/early-access/integrations/authentication/#as-an-integration
 *
 * @param {Date} [exp=1 minute from now] - date to expire on
 * @throws {GitHubError} - on an error
 * @returns {String} - JWT bearer token to authenticate with
 */
export async function generateJWT (exp = moment().add(1, 'minutes').toDate()) {
  paramAssert(exp.getTime, 'function', 'generateJWT', 'expiration date')
  paramAssert(config.github.integration.id, 'number', 'generateJWT', 'integration ID')

  const key = await new Promise((resolve, reject) => {
    log.debug('Rading integration key')
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
    log.debug('Generating a new JWT token')

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
 * @see https://developer.github.com/early-access/integrations/authentication/#as-an-installation
 *
 * @param {Number} inst - GitHub organization installation ID
 * @param {Number} [user] - optional GitHub user id to generate token on behalf of
 * @throws {GitHubError} - on an error
 * @returns {String} - GitHub token to use for authentication
 */
export async function generateToken (inst, user) {
  paramAssert(inst, 'number', 'generateToken', 'installation ID')
  paramAssert(config.github.integration.id, 'number', 'generateToken', 'integration ID')

  const cachedToken = getToken(inst, user)
  if (cachedToken != null) return cachedToken.token

  const JWT = await generateJWT()

  const githubReq = api
  .post(`/installations/${inst}/access_tokens`)
  .set('Authorization', `Bearer ${JWT}`)

  if (user != null) {
    log.debug(`Generating a token for user ${user}`)
    githubReq.send({ 'user_id': user })
  }

  const githubRes = await githubReq
  .then((res) => res.body)
  .catch((err) => {
    if (err.status === '404') {
      log.error('Trying to generate GitHub token for an incorrect organization integration ID')
      throw new GitHubError('Authentication denied')
    }

    log.error(`Trying to generate GitHub token returned a ${err.status}`)
    throw new GitHubError('Unable to generate authentication token')
  })

  if (githubRes != null && githubRes.token != null && githubRes.expires_at != null) {
    setToken(inst, githubRes.token, moment(githubRes.expires_at).toDate(), user)

    return githubRes.token
  } else {
    log.error('GitHub token generation returned an unexpected body')
    throw new GitHubError('Unable to generate authentication token')
  }
}

/**
 * getRepos
 * Fetches all repos the token has access to
 *
 * @see https://developer.github.com/v3/repos/#list-user-repositories
 *
 * @param {String} token - GitHub authentication token
 * @param {String} [sort] - what to sort the repos by
 * @throws {GitHubError} - on an error
 * @returns {Object}[] - a list of mapped GitHub projects
 */
export function getRepos (token, sort = 'pushed') {
  paramAssert(token, 'string', 'getRepos', 'token')
  paramAssert(sort, 'string', 'getRepos', 'sort')

  const req = api
  .get('/user/repos')
  .set('Authorization', `token ${token}`)
  .query({ sort })

  return pagination(req)
  .then((res) => res.body.map((project) => castProject(project)))
  .catch((err, res) => {
    throw errorCheck(err, res, 'getRepos')
  })
}

/**
 * getReleases
 * Fetches all releases a repo has
 *
 * @see https://developer.github.com/v3/repos/releases/#list-releases-for-a-repository
 *
 * @param {String} owner - GitHub user / organization that ownes the repo
 * @param {String} repo - GitHub repo name
 * @param {String} [token] - GitHub authentication token
 * @throws {GitHubError} - on an error
 * @returns {Object}[] - a list of mapped GitHub releases
 */
export function getReleases (owner, repo, token) {
  paramAssert(owner, 'string', 'getReleases', 'owner')
  paramAssert(repo, 'string', 'getReleases', 'repo')

  let req = api
  .get(`/repos/${owner}/${repo}/releases`)

  if (token != null) req = req.set('Authorization', `token ${token}`)

  return pagination(req)
  .then((res) => res.body.map((release) => castRelease(release)))
  .catch((err, res) => {
    throw errorCheck(err, res, 'getReleases', `${owner}/${repo}`)
  })
}

/**
 * getPermission
 * Checks collaborator status of user on repository
 *
 * @see https://developer.github.com/v3/repos/collaborators/#check-if-a-user-is-a-collaborator
 *
 * @param {String} owner - GitHub owner
 * @param {String} repo - GitHub repository
 * @param {String} username - GitHub username
 * @param {String} [token] - token for GitHub authentication
 * @throws {GitHubError} - on an error
 * @returns {Boolean} - true if user is a collaborator of repository
 */
export function getPermission (owner, repo, username, token) {
  paramAssert(owner, 'string', 'getPermission', 'owner')
  paramAssert(repo, 'string', 'getPermission', 'repo')
  paramAssert(username, 'string', 'getPermission', 'username')

  let req = api
  .get(`/repos/${owner}/${repo}/collaborators/${username}`)

  if (token != null) req = req.set('Authorization', `token ${token}`)

  return req
  .then((res) => (res.status === 204))
  .catch(() => false)
}

/**
 * getLabel
 * Returns GitHub label for repository
 *
 * @see https://developer.github.com/v3/issues/labels/#get-a-single-label
 *
 * @param {String} owner - GitHub owner
 * @param {String} repo - GitHub repository
 * @param {String} label - GitHub label name
 * @param {String} token - token for GitHub authentication
 *
 * @throws {GitHubError} - on an error
 * @returns {Object} - raw GitHub response body object
 */
export function getLabel (owner, repo, label, token) {
  paramAssert(owner, 'string', 'getLabel', 'owner')
  paramAssert(repo, 'string', 'getLabel', 'repo')
  paramAssert(label, 'string', 'getLabel', 'label')
  paramAssert(token, 'string', 'getLabel', 'token')

  return api
  .get(`/repos/${owner}/${repo}/labels/${label}`)
  .set('Authorization', `token ${token}`)
  .then((res) => res.body)
  .catch((err, res) => {
    throw errorCheck(err, res, 'getLabel', `${owner}/${repo}`)
  })
}

/**
 * postLabel
 * Creates a label on GitHub repository
 *
 * @see https://developer.github.com/v3/issues/labels/#create-a-label
 *
 * @param {String} owner - GitHub owner
 * @param {String} repo - GitHub repository
 * @param {String} token - token for GitHub authentication
 *
 * @param {Object} label - label to create
 * @param {String} label.name - label name
 * @param {String} label.color - label color in 6 hex code
 *
 * @throws {GitHubError} - on an error
 * @returns {Object} - raw GitHub response body object
 */
export function postLabel (owner, repo, token, label) {
  if (!config.github.post) {
    log.verbose('Config prohibits posting to GitHub. Not posting label')
    return Promise.resolve(label) // like it happened minus the url key
  }

  paramAssert(owner, 'string', 'postLabel', 'owner')
  paramAssert(repo, 'string', 'postLabel', 'repo')
  paramAssert(token, 'string', 'postLabel', 'token')
  paramAssert(label, 'object', 'postLabel', 'label')
  paramAssert(label.name, 'string', 'postLabel', 'label name')
  paramAssert(label.color, 'string', 'postLabel', 'label color')

  return api
  .post(`/repos/${owner}/${repo}/labels`)
  .set('Authorization', `token ${token}`)
  .send(label)
  .then((res) => res.body)
  .catch((err, res) => {
    throw errorCheck(err, res, 'postLabel', `${owner}/${repo}`)
  })
}

/**
 * postIssue
 * Creates an issue on GitHub repository
 *
 * @see https://developer.github.com/v3/issues/#create-an-issue
 *
 * @param {String} owner - GitHub owner
 * @param {String} repo - GitHub repository
 * @param {String} token - token for GitHub authentication
 *
 * @param {Object} issue - issue to put in GitHub repository
 * @param {String} issue.title - GitHub issue title
 * @param {String} [issue.body] - GitHub issue body
 * @param {Number} [issue.milestone] - GitHub milestone ID to attach to issue
 * @param {String[]} [issue.label] - GitHub labels to attach to issue
 * @param {String[]} [issue.assignees] - GitHub users to assign to issue
 *
 * @throws {GitHubError} - on an error
 * @returns {Number} - GitHub issue number
 */
export function postIssue (owner, repo, token, issue) {
  if (!config.github.post) {
    log.verbose('Config prohibits posting to GitHub. Not posting issue')
    return Promise.resolve(0)
  }

  paramAssert(owner, 'string', 'postIssue', 'owner')
  paramAssert(repo, 'string', 'postIssue', 'repo')
  paramAssert(token, 'string', 'postIssue', 'token')
  paramAssert(issue, 'object', 'postIssue', 'issue')
  paramAssert(issue.title, 'string', 'postIssue', 'issue title')

  return api
  .post(`/repos/${owner}/${repo}/issues`)
  .set('Authorization', `token ${token}`)
  .send(issue)
  .then((res) => res.body.number)
  .catch((err, res) => {
    throw errorCheck(err, res, 'postIssue', `${owner}/${repo}`)
  })
}

/**
 * postFile
 * Creates a file for a release asset
 * NOTE: uploading uses a different domain than the regular API
 *
 * @see https://developer.github.com/v3/repos/releases/#upload-a-release-asset
 *
 * @param {String} owner - GitHub owner
 * @param {String} repo - GitHub repository
 * @param {Number} release - GitHub release ID to publish to
 * @param {String} token - token for GitHub authentication
 *
 * @param {Object} file - file to upload to GitHub
 * @param {String} file.name - name of file on github
 * @param {String} [file.label] - special label to put next to title on GitHub
 * @param {String} file.path - full path to file that should be uploaded
 *
 * @throws {GitHubError} - on an error
 * @returns {Number} - GitHub asset number
 */
export async function postFile (owner, repo, release, token, file) {
  if (!config.github.post) {
    log.verbose('Config prohibits posting to GitHub. Not posting file')
    return 0
  }

  paramAssert(owner, 'string', 'postFile', 'owner')
  paramAssert(repo, 'string', 'postFile', 'repo')
  paramAssert(release, 'number', 'postFile', 'release')
  paramAssert(token, 'string', 'postFile', 'token')
  paramAssert(file, 'object', 'postFile', 'file')
  paramAssert(file.name, 'string', 'postFile', 'file title')
  paramAssert(file.path, 'string', 'postFile', 'file path')

  const filePath = file.path
  delete file.path

  await new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stat) => {
      if (err) {
        log.error(`GitHub service tryed to postFile that does not exist`, err)
        return reject(new GitHubError('Unable to postFile that does not exist'))
      }

      return resolve()
    })
  })

  return api
  .post(`https://uploads.github.com/repos/${owner}/${repo}/${release}/assets`)
  .query(file)
  .set('Authorization', `token ${token}`)
  .attach('file', filePath, file.name)
  .then((res) => res.body.id)
  .catch((err, res) => {
    throw errorCheck(err, res, 'postFile', `${owner}/${repo}#${release}`)
  })
}
