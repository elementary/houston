/**
 * core/service/github.js
 * Handles requests to GitHub, parsed and ready for use by Houston
 *
 * @exports {Function} GetReleases
 * @exports {Function} GetProjects
 */

import { Config, Request, Log } from '~/app'

export function GetReleases (owner, name, token) {
  return Request
  .get(`https://api.github.com/repos/${owner}/${name}/releases`)
  .auth(token)
  .then(res => res.body)
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

export function GetProjects (token) {
  return Request
  .get(`https://api.github.com/user/repos?visibility=public`)
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

export function SendIssue (issue, project) {
  if (!Config.github.post) {
    Log.verbose('GitHub config prohibits posting of issues')
    return
  }

  return Request
  .post(`https://api.github.com/repos/${project.github.fullName}/issues`)
  .auth(project.github.token)
  .send(JSON.stringify({
    title: issue.title,
    body: issue.body,
    labels: [project.github.label]
  }))
  .then(data => {
    Log.debug(`Sent issue to ${project.github.fullName} on GitHub`)
  })
}
