/**
 * service/github.js
 * Handles all communication with GitHub api
 * NOTE: This file uses GitHub early-access integrations. Things may change
 * NOTE: GitHub api requires the use of a custom `Accept` header while in early-access
 * @flow
 *
 * @exports {Object} default - superagent for communicating with GitHub
 * @exports {Class} GitHubError - error related to communication with GitHub
 * @exports {Function} castProject - Casts a GitHub project for internal use.
 * @exports {Function} castRelease - Casts a GitHub release for internal use
 * @exports {Function} generateJWT - Generates JWT bearer token
 * @exports {Function} generateToken - Generates GitHub authentication token
 * @exports {Function} getRepo - Fetches a repository by GitHub ID
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
import * as error from 'lib/error/service'
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
const tokenCache: Array<Object> = []

/**
 * getToken
 * Returns a token from the cache or null if it does not exist
 *
 * @param {Number} inst - GitHub organization integration ID
 * @param {Number} [user] - optional GitHub user id
 * @return {String} - GitHub token or null for non-existant
 */
const getToken = (inst: number, user: ?number = null): ?string => {
  const foundIndex = tokenCache.findIndex((a) => {
    if (a == null) return false // the actual fuck

    return (a.inst === inst && a.user === user)
  })

  // Remove anything that is less than one minute to expire
  if (foundIndex !== -1 && tokenCache[foundIndex].exp.getTime() < Date.now() + 1000) {
    delete tokenCache[foundIndex]
    return null
  }

  if (foundIndex !== -1) return tokenCache[foundIndex]['token']
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
const setToken = (inst: number, token: string, exp: Date, user: ?number = null): void => {
  tokenCache.push({ inst, token, exp, user })
}

/**
 * errorCheck
 * Checks generatic GitHub status codes for a more descriptive error
 *
 * @param {Object} err - superagent error to check
 * @param {Object} [res] - GitHub response object
 * @returns {ServiceError} - a parsed error from GitHub
 */
const errorCheck = (err: Object, res: ?Object): error.ServiceError => {
  if (err.status === 401) {
    log.info(`Bad credentials`)
    return new error.ServiceError('GitHub', 'Bad Credentials')
  }

  if (err.status === 403) {
    log.warn('Exceeding maximum number of authentication calls to GitHub')

    if (res != null && res.header != null && res.header['x-rate-limit-reset'] != null) {
      return new error.ServiceLimitError('GitHub', new Date(res.header['x-ratelimit-reset'] * 1000))
    }

    return new error.ServiceLimitError('GitHub')
  }

  if (res != null) {
    if (res.body != null && res.body.message != null) {
      log.error(res.body.message)

      return new error.ServiceRequestError('GitHub', res.status, res.body.message)
    }

    log.error(error.toString())
    return new error.ServiceRequestError('GitHub', res.status, err.toString())
  }

  log.error(err)
  return new error.ServiceError('GitHub', err.toString())
}

/**
 * castProject
 * Casts a GitHub project to a simpler object for internal use
 *
 * @param {Object} project - GitHub API project object
 * @param {Number} [installation] - GitHub installation number
 * @returns {Object} - a mapped project object
 */
export function castProject (project: Object, installation: ?Number): Object {
  const owner = service.nameify(project.owner.login)
  const repo = service.nameify(project.name)

  // Why GitHub mixes different urls depending on API call I don't know
  if (project.git_url.substr(0, 6) === 'git://') {
    project.git_url = `https://${project.git_url.substr(6)}`
  } else if (project.git_url.substr(0, 4) === 'git:') {
    project.git_url = `https://${project.git_url.substr(4)}`
  }

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
export function castRelease (release: Object): Object {
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
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {String} - JWT bearer token to authenticate with
 */
export async function generateJWT (exp: Date = moment().add(1, 'minutes').toDate()): Promise<string> {
  const key = await new Promise((resolve, reject) => {
    log.debug('Reading integration key')

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
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {String} - GitHub token to use for authentication
 */
export async function generateToken (inst: number, user: ?number): Promise<string> {
  const cachedToken = getToken(inst, user)
  if (cachedToken != null) {
    log.debug(`Using cached token key for installation #${inst}`)
    return cachedToken
  }

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
      throw new error.ServiceError('GitHub', 'Incorrect organization integration ID')
    }

    log.error(`Trying to generate GitHub token returned a ${err.status}`)
    throw new error.ServiceRequestError('GitHub', err.status, 'Unable to generate authentication token')
  })

  if (githubRes != null && githubRes.token != null && githubRes.expires_at != null) {
    setToken(inst, githubRes.token, moment(githubRes.expires_at).toDate(), user)

    return githubRes.token
  } else {
    log.error('GitHub token generation returned an unexpected body')
    throw new error.ServiceError('GitHub', 'Unable to generate authentication token')
  }
}

/**
 * getRepo
 * Fetches a single repository
 *
 * @see https://developer.github.com/v3/repos/#get
 *
 * @param {String} owner - GitHub owner name
 * @param {String} repo - GitHub repository name
 * @param {String} token - GitHub authentication token
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Object} - A single Project like GitHub object
 */
export function getRepo (owner: string, repo: string, token: string): Promise<Object> {
  return api
  .get(`/repos/${owner}/${repo}`)
  .set('Authorization', `token ${token}`)
  .then((res) => castProject(res.body))
  .catch((err, res) => {
    throw errorCheck(err, res, 'getRepos')
  })
}

/**
 * getRepos
 * Fetches all repos the token has access to
 *
 * @see https://developer.github.com/v3/repos/#list-user-repositories
 *
 * @param {String} token - GitHub authentication token
 * @param {String} [sort] - what to sort the repos by
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Object}[] - a list of mapped GitHub projects
 */
export function getRepos (token: string, sort: string = 'pushed'): Promise<Array<Object>> {
  const req = api
  .get('/user/repos')
  .set('Authorization', `token ${token}`)
  .query({ sort })

  return pagination(req)
  .then((res) => res.body.map((project) => castProject(project)))
  .catch((err, res) => {
    throw errorCheck(err, res)
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
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Object}[] - a list of mapped GitHub releases
 */
export function getReleases (owner: string, repo: string, token: ?string): Promise<Array<Object>> {
  let req = api
  .get(`/repos/${owner}/${repo}/releases`)

  if (token != null) req = req.set('Authorization', `token ${token}`)

  return pagination(req)
  .then((res) => res.body.map((release) => castRelease(release)))
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}

/**
 * getReleaseByTag
 * Fetches a single release based on the Git tag
 *
 * @see https://developer.github.com/v3/repos/releases/#get-a-release-by-tag-name
 *
 * @param {String} owner - GitHub user / organization that ownes the repo
 * @param {String} repo - GitHub repo name
 * @param {String} tag - Git tag to lookup
 * @param {String} [token] - GitHub authentication token
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Object} - a mapped GitHub release
 */
export function getReleaseByTag (owner: string, repo: string, tag: string, token: ?string): Promise<Object> {
  let req = api
  .get(`/repos/${owner}/${repo}/releases/tags/${tag}`)

  if (token != null) req = req.set('Authorization', `token ${token}`)

  return req
  .then((res) => castRelease(res.body))
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}

/**
 * getInstallations
 * Returns a list of repositories for token
 *
 * @see https://developer.github.com/v3/integrations/installations/
 *
 * @param {String} token - token for GitHub authentication
 * @param {String} [user] - GitHub ID of user to cross reference for
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Object[]} - List of casted repositories
 */
export function getInstallations (token: string, user: ?string): Promise<Object> {
  return api
  .get('/installation/repositories')
  .set('Authorization', `token ${token}`)
  .then((res) => res.body.repositories.map((repo) => castProject(repo)))
  .catch((err, res) => {
    throw errorCheck(err, res)
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
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Boolean} - true if user is a collaborator of repository
 */
export function getPermission (owner: string, repo: string, username: string, token: ?string): Promise<Boolean> {
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
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Object} - raw GitHub response body object
 */
export function getLabel (owner: string, repo: string, label: string, token: string): Promise<Object> {
  return api
  .get(`/repos/${owner}/${repo}/labels/${label}`)
  .set('Authorization', `token ${token}`)
  .then((res) => res.body)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}

/**
 * getAssets
 * Returns raw GitHub array of release assets
 *
 * @see https://developer.github.com/v3/repos/releases/#list-assets-for-a-release
 *
 * @param {String} owner - GitHub owner
 * @param {String} repo - GitHub repository
 * @param {String} release - GitHub release ID
 * @param {String} [token] - GitHub authentication token
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Object} - raw GitHub response body object
 */
export function getAssets (owner: string, repo: string, release: string, token: ?string): Promise<Object> {
  let req = api
  .get(`/repos/${owner}/${repo}/releases/${release}/assets`)

  if (token != null) req = req.set('Authorization', `token ${token}`)

  return req
  .then((res) => res.body)
  .catch((err, res) => {
    throw errorCheck(err, res)
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
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Object} - raw GitHub response body object
 */
export function postLabel (owner: string, repo: string, token: string, label: Object): Promise<Object> {
  if (!config.github.post) {
    log.debug('Config prohibits posting to GitHub. Not posting label')
    return Promise.resolve(label) // like it happened minus the url key
  }

  return api
  .post(`/repos/${owner}/${repo}/labels`)
  .set('Authorization', `token ${token}`)
  .send(label)
  .then((res) => res.body)
  .catch((err, res) => {
    throw errorCheck(err, res)
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
 * @param {String[]} [issue.labels] - GitHub labels to attach to issue
 * @param {String[]} [issue.assignees] - GitHub users to assign to issue
 *
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Number} - GitHub issue number
 */
export function postIssue (owner: string, repo: string, token: string, issue: Object): Promise<number> {
  if (!config.github.post) {
    log.debug('Config prohibits posting to GitHub. Not posting issue')
    return Promise.resolve(0)
  }

  return api
  .post(`/repos/${owner}/${repo}/issues`)
  .set('Authorization', `token ${token}`)
  .send(issue)
  .then((res) => res.body.number)
  .catch((err, res) => {
    throw errorCheck(err, res)
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
 * @async
 * @throws {GitHubError} - on an error
 * @returns {Number} - GitHub asset number
 */
export async function postFile (owner: string, repo: string, release: number, token: string, file: Object): Promise<number> {
  if (!config.github.post) {
    log.debug('Config prohibits posting to GitHub. Not posting file')
    return 0
  }

  const filePath = file.path
  delete file.path

  await new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stat) => {
      const res = new error.ServiceError('GitHub', 'Unable to postFile that does not exist')

      if (err) {
        log.error('GitHub service tried to postFile that does not exist')
        log.error(err)

        return reject(res)
      }

      if (!stat.isFile()) return reject(res)

      return resolve()
    })
  })

  return api
  .post(`https://uploads.github.com/repos/${owner}/${repo}/releases/${release}/assets`)
  .set('Authorization', `token ${token}`)
  .query(file)
  .attach('file', filePath, file.name)
  .then((res) => res.body.id)
  .catch((err, res) => {
    throw errorCheck(err, res)
  })
}
