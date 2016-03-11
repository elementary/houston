/**
 * core/service/github.js
 * Handles requests to GitHub, parsed and ready for use by Houston
 *
 * @exports {Function} GetReleases
 * @exports {Function} GetProjects
 * @exports {Function} SendLabel
 * @exports {Function} SendIssue
 */

import Semver from 'semver'

import { Config, Request, Log } from '~/app'

/**
 * GetReleases
 * Returns mapped array of releases from GitHub project
 *
 * @param {String} owner - GitHub owner
 * @param {String} name - GitHub project
 * @param {String} token - GitHub authentication token
 * @returns {Array} - Mapped releases
 */
export function GetReleases (owner, name, token) {
  return Request
  .get(`https://api.github.com/repos/${owner}/${name}/releases`)
  .auth(token)
  .then(res => res.body)
  .filter(release => Semver.valid(release.tag_name))
  .map(release => {
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
}

/**
 * GetProjects
 * Returns mapped array of projects
 *
 * @param {String} token - GitHub authentication token
 * @returns {Array} - Mapped projects
 */
export function GetProjects (token) {
  return Request
  .get('https://api.github.com/user/repos?visibility=public')
  .auth(token)
  .then(res => res.body)
  .filter(githubProject => {
    return Request
    .get(`https://api.github.com/repos/${githubProject.full_name}/contents/.apphub`)
    .auth(token)
    .then(() => true)
    .catch(() => false)
  })
  .map(project => {
    return {
      repo: project.git_url,
      tag: project.default_branch,
      github: {
        id: project.id,
        owner: project.owner.login,
        name: project.name,
        token: token
      }
    }
  })
}

/**
 * SendLabel
 * Creates label for GitHub project issues
 *
 * @param {Object} project - Database object for a project
 * @returns {Promise} - Empty promise of success
 */
export function SendLabel (project) {
  if (!Config.github.post) {
    Log.verbose('GitHub config prohibits posting. Not posting label')
    return
  }

  return Request
  .post(`https://api.github.com/repos/${project.github.fullName}/labels`)
  .auth(project.github.token)
  .send(JSON.stringify({
    name: project.github.label,
    color: '3A416F'
  }))
  .then(data => {
    return Promise.resolve()
  }, err => {
    if (err.status !== 422) {
      Log.warn(err.message)
      return Promise.reject(`Received error code ${err.status} from GitHub`)
    } else {
      Log.debug(`Label already created in GitHub for ${project.github.fullName}`)
      return Promise.resolve()
    }
  })
}

/**
 * SendIssue
 * Creates issue for GitHub project
 *
 * @param {Object} issue - {
 *   {String} title - Issue title
 *   {String} body - Issue body
 * }
 * @param {Object} project - Database object of project
 * @returns {Promise} - Empty promise of success
 */
export function SendIssue (issue, project) {
  if (!Config.github.post) {
    Log.verbose('GitHub config prohibits posting. Not submitting issue')
    Log.silly(issue.body)
    return
  }

  return Request
  .post(`https://api.github.com/repos/${project.github.fullName}/issues`)
  .auth(Config.github.access)
  .send(JSON.stringify({
    title: issue.title,
    body: issue.body
  }))
  .then(res => res.body)
  .then(res => {
    return Request
    .patch(`https://api.github.com/repos/${project.github.fullName}/issues/${res.number}`)
    .auth(project.github.token)
    .send(JSON.stringify({
      labels: [ project.github.label ]
    }))
    .then(data => {
      Log.debug(`Sent issue to ${project.github.fullName} on GitHub`)
      return Promise.resolve()
    })
  })
}
