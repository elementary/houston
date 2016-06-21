/**
 * houston/service/github.js
 * Handles requests to GitHub, parsed and ready for use by Houston
 *
 * @exports {Function} castRelease - Casts GitHub release to database object
 * @exports {Function} getReleases - Returns mapped array of releases from GitHub project
 * @exports {Function} getProjects - Returns mapped array of projects
 * @exports {Function} sendLabel - Creates label for GitHub project issues
 * @exports {Function} sendIssue - Creates issue for GitHub project
 * @exports {Function} upsertHook - Creates or updates hook for GitHub project
 */

import semver from 'semver'

import config from '~/lib/config'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'
import request from '~/lib/request'

/**
 * codize
 * Replaces string with a houston valid string (all lowercase, all dashs, etc)
 * Lower case, replace any whitespace or _ with -, replace ANYTHING else with nothing
 *
 * @param {String} str - String to codize
 * returns {String} - Replaces clean string to use in Houston
 */
function codize (str) {
  return str.toLowerCase().replace(/(\s|\_)/gmi, '-').replace(/(?![a-z]|\-)./, '')
}

/**
 * castRelease
 * Casts GitHub release to database object
 *
 * @param {Object} release - GitHub release object
 * @returns {Object} - Mapped release object
 */
export function castRelease (release) {
  try {
    semver.valid(release.tag_name, true)
  } catch (error) {
    throw new Mistake(500, 'GitHub release tag is not valid semver')
  }

  return {
    version: semver.valid(release.tag_name, true),
    changelog: release.body.match(/.+/g),
    github: {
      id: release.id,
      author: release.author.login,
      date: release.published_at,
      tag: release.tag_name
    },
    date: {
      released: release.published_at
    }
  }
}

/**
 * getReleases
 * Returns mapped array of releases from GitHub project
 *
 * @param {String} owner - GitHub owner
 * @param {String} name - GitHub project
 * @param {String} token - GitHub authentication token
 * @returns {Array} - Mapped releases
 */
export function getReleases (owner, name, token) {
  if (!config.github) {
    throw new Mistake(503, 'Github is currently disabled')
  }

  return request
  .get(`https://api.github.com/repos/${owner}/${name}/releases`)
  .auth(token)
  .then((res) => res.body)
  .filter((release) => semver.valid(release.tag_name))
  .map((release) => castRelease(release))
  .catch((error) => {
    throw new Mistake(500, 'Houston had a problem getting releases on GitHub', error)
  })
}

/**
 * getProjects
 * Returns mapped array of projects
 *
 * @param {String} token - GitHub authentication token
 * @returns {Array} - Mapped projects
 */
export function getProjects (token) {
  if (!config.github) {
    throw new Mistake(503, 'Github is currently disabled')
  }

  return request
  .get('https://api.github.com/user/repos?visibility=public')
  .auth(token)
  .then((res) => res.body)
  .filter((githubProject) => {
    return request
    .get(`https://api.github.com/repos/${githubProject.full_name}/contents/.apphub`)
    .auth(token)
    .then(() => true)
    .catch(() => false)
  })
  .map((project) => {
    return {
      name: `com.github.${codize(project.owner.login)}.${codize(project.name)}`,
      repo: project.git_url,
      tag: project.default_branch,
      github: {
        id: project.id,
        owner: project.owner.login,
        name: project.name,
        private: project.private,
        token
      }
    }
  })
  .catch((error) => {
    throw new Mistake(500, 'Houston had a problem getting projects on GitHub', error)
  })
}

/**
 * getPermission
 * Checks collaborator status of user on repository
 *
 * @param {String} owner - GitHub owner
 * @param {String} name - GitHub project
 * @param {String} username - GitHub username
 * @param {String} token - User token for GitHub access
 * @returns {Boolean} - true if user is a collaborator of repository
 */
export function getPermission (owner, name, username, token) {
  return request
  .get(`https://api.github.com/repos/${owner}/${name}/collaborators/${username}`)
  .auth(token)
  .then((res) => (res.status === 204))
  .catch(() => false)
}

/**
 * sendLabel
 * Creates label for GitHub project issues
 *
 * @param {String} owner - GitHub owner
 * @param {String} name - GitHub project
 * @param {String} token - GitHub authentication token
 * @param {String} label - Label to create in GitHub
 * @returns {Promise} - Empty promise of success
 */
export function sendLabel (owner, name, token, label) {
  if (!config.github.post) {
    log.verbose('GitHub config prohibits posting. Not posting label')
    return Promise.resolve()
  }

  return request
  .post(`https://api.github.com/repos/${owner}/${name}/labels`)
  .auth(token)
  .send(JSON.stringify({
    name: label,
    color: '3A416F'
  }))
  .then()
  .catch((error) => {
    if (error.status === 422) return

    throw new Mistake(500, 'Houston had a problem creating a label on GitHub', error)
  })
}

/**
 * sendIssue
 * Creates issue for GitHub project
 *
 * @param {String} owner - GitHub owner
 * @param {String} name - GitHub project
 * @param {String} token - GitHub authentication token
 * @param {Object} issue - {
 *   {String} title - Issue title
 *   {String} body - Issue body
 * }
 * @param {String} label - GitHub label to use for issue
 * @returns {Promise} - Empty promise of success
 */
export function sendIssue (owner, name, token, issue, label) {
  if (!config.github.post) {
    log.verbose('GitHub config prohibits posting. Not submitting issue')
    return Promise.resolve()
  }

  return request
  .post(`https://api.github.com/repos/${owner}/${name}/issues`)
  .auth(config.github.access)
  .send(issue)
  .then((res) => res.body)
  .then((res) => {
    return request
    .patch(`https://api.github.com/repos/${owner}/${name}/issues/${res.number}`)
    .auth(token)
    .send({
      labels: [label]
    })
  })
  .catch((error) => {
    if (error.status != null && error.status === 401) {
        throw new Mistake(500, 'config.github.access is invalid', error)
    }

    throw new Mistake(500, 'Houston had a problem creating an issue on GitHub', error)
  })
}

/*
 * sendFile
 * Posts a file to GitHub release
 *
 * @param {String} owner - GitHub owner
 * @param {String} name - GitHub project
 * @param {Number} release - GitHub release id
 * @param {String} token - GitHub authentication token
 * @param {Buffer} file - File buffer to upload
 * @param {Object} meta - {
 *   {String} content - http content type of file ('application/vnd.debian.binary-package')
 *   {String} name - File name on GitHub
 *   {String} label - GitHub short description
 * }
 * @returns {Promise} - Returning GitHub issue api response
 */
export function sendFile (owner, name, release, token, file, meta) {
  if (!config.github.post) {
    log.verbose('GitHub config prohibits posting. Not posting file')
    return Promise.resolve()
  }

  return request
  .post(`https://uploads.github.com/repos/${owner}/${name}/releases/${release}/assets`)
  .query(meta)
  .set('Content-Type', meta.content)
  .set('Content-Length', file.length)
  .auth(token)
  .send(file)
  .then((res) => res.body)
  .catch((error) => {
    throw new Mistake(500, 'Houston had a problem posting an file on GitHub', error)
  })
}

/**
 * upsertHook
 * Creates or updates hook for GitHub project
 *
 * @param {String} owner - GitHub owner
 * @param {String} name - GitHub project
 * @param {String} token - GitHub user token
 * @param {String} secret - GitHub hook secret token
 * @returns {Promise} - GitHub id of hook
 */
export async function upsertHook (owner, name, token, secret) {
  if (!config.github.hook) {
    log.verbose('GitHub config prohibits posting and hooks. Not posting hook')
    return Promise.reject()
  }

  const hookEvents = ['release']
  const hookConfig = {
    url: `${config.server.url}/hook/github`,
    content_type: 'json',
    secret
  }

  const existingHook = await request
  .get(`https://api.github.com/repos/${owner}/${name}/hooks`)
  .auth(token)
  .then((res) => res.body)
  .then((hooks) => {
    return hooks.find((hook) => {
      if (hook.config == null || hook.config.url == null) return false
      return hook.config.url === hookConfig.url
    })
  })
  .catch((error) => {
    throw new Mistake(500, 'Houston had a problem checking GitHub hooks', error)
  })

  if (existingHook == null) {
    return request
    .post(`https://api.github.com/repos/${owner}/${name}/hooks`)
    .auth(token)
    .send({
      name: 'web',
      active: true,
      events: hookEvents,
      config: hookConfig
    })
    .then((res) => res.body.id)
    .catch((error) => {
      throw new Mistake(500, 'Houston had a problem creating the hook on GitHub', error)
    })
  } else if (existingHook.config !== hookConfig || existingHook.events !== hookEvents) {
    return request
    .patch(`https://api.github.com/repos/${owner}/${name}/hooks/${existingHook.id}`)
    .auth(token)
    .send({
      active: true,
      events: hookEvents,
      config: hookConfig
    })
    .then((res) => res.body.id)
    .catch((error) => {
      throw new Mistake(500, 'Houston had a problem updating the hook on GitHub', error)
    })
  } else {
    return existingHook.id
  }
}
