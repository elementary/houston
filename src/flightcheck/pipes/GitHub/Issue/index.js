/**
 * flightcheck/pipes/GitHub/Issue/index.js
 * Creates GitHub issues based on pipe logs
 *
 * @exports {Pipe} - Create GitHub Issues
 */

import config from 'lib/config'
import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'
import request from 'lib/request'

const log = new Log('flightcheck:GitHubIssue')

/**
 * GitHubIssue
 * Post logs to GitHub
 *
 * @extends Pipe
 */
export default class GitHubIssue extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Pipeline} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    // All files that were published
    this.data.published = []
  }

  /**
   * code
   * Create GitHub Issues
   *
   * @param {String} level - override apphub log level
   * @returns {Void}
   */
  async code (level) {
    if (this.pipeline.build.source !== 'github') {
      return this.log('debug', 'GitHub/Issue/unsupported.md')
    }

    if (!config.github.access || !config.github.post) {
      return this.log('debug', 'GitHub/Issue/disabled.md', !config.github.post)
    }

    const apphub = await this.require('AppHub')

    if (level == null) level = apphub.log.level

    const logs = await this.pipeline.logs(level)

    log.debug(`GitHubIssue has ${logs.length} logs to publish`)

    if (logs.length < 1) return

    // Filter the github information from the repo url
    // Possible urls are https://github.com/vocalapp/vocal
    // and git@github.com:vocalapp/vocal.git
    // @see Pipeline class for same code
    const splits = this.pipeline.build.repo.split(/(\/|:)/)
    const owner = splits[splits.length - 3].replace('.', '_')
    const repo = splits[splits.length - 1].replace('.git', '').replace('.', '_')

    log.debug(`GitHubIssue found GitHub owner and repo: ${owner}/${repo}`)

    let label = false
    if (this.pipeline.build.auth != null) {
      label = await request
      .post(`https://api.github.com/repos/${owner}/${repo}/labels`)
      .auth(this.pipeline.build.auth)
      .send({
        name: apphub.log.label,
        color: apphub.log.color
      })
      .then(() => true)
      .catch(async (error) => {
        if (error.status === 422) return true // it already exists

        await this.log('warn', 'GitHub/Issue/label.md')
        return false
      })
    } else {
      await this.log('debug', 'GitHub/Issue/auth.md')
    }

    return Promise.each(logs, async (log) => {
      const res = await request
      .post(`https://api.github.com/repos/${owner}/${repo}/issues`)
      .auth(config.github.access)
      .send(log)
      .then((res) => res.body)

      if (!label) return

      return request
      .patch(`https://api.github.com/repos/${owner}/${repo}/issues/${res.number}`)
      .auth(this.pipeline.build.auth)
      .send({
        labels: [apphub.log.label]
      })
    })
    .catch((err) => {
      log.error('GitHubIssue encountered an error trying to publish logs')
      log.error(err)
      return this.log('error', 'GitHub/Issue/error.md')
    })
  }
}
