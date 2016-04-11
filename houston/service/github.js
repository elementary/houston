/**
 * houston/service/github.js
 * Handles requests to GitHub, parsed and ready for use by Houston
 *
 * @exports {Function} getReleases - Returns mapped array of releases from GitHub project
 * @exports {Function} getProjects - Returns mapped array of projects
 * @exports {Function} sendLabel - Creates label for GitHub project issues
 * @exports {Function} sendIssue
 */

import semver from 'semver'

import config from '~/lib/config'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'
import request from '~/lib/request'

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
  if (!config.aptly) {
    throw new Mistake(503, 'Github is currently disabled')
  }

  return request
  .get(`https://api.github.com/repos/${owner}/${name}/releases`)
  .auth(token)
  .then((res) => res.body)
  .filter((release) => semver.valid(release.tag_name))
  .map((release) => {
    return {
      github: {
        id: release.id,
        author: release.author.login,
        date: release.published_at,
        tag: release.tag_name
      },
      changelog: release.body.match(/.+/g)
    }
  })
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
      repo: project.git_url,
      tag: project.default_branch,
      github: {
        id: project.id,
        owner: project.owner.login,
        name: project.name,
        token
      }
    }
  })
  .catch((error) => {
    throw new Mistake(500, 'Houston had a problem getting projects on GitHub', error)
  })
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
    throw new Mistake(500, 'Houston had a problem creating an issue on GitHub', error)
  })
}
