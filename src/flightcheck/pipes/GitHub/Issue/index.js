/**
 * flightcheck/pipes/GitHub/Issue/index.js
 * Creates GitHub issues based on pipe logs
 *
 * @exports {Pipe} - Create GitHub Issues
 */

import * as github from 'service/github'
import config from 'lib/config'
import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'

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

    if (this.pipeline.build.auth == null || !config.github.post) {
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

    log.debug(`Found GitHub owner and repo: ${owner}/${repo}`)

    const token = await github.generateToken(Number(this.pipeline.build.auth))

    const hasLabel = await github.getLabel(owner, repo, apphub.log.label, token)
    .then(() => true)
    .catch(() => false)

    if (hasLabel) {
      log.debug('Label already exists. Not posting new label')
    } else {
      log.debug('Label does not exist. Posting new label')

      try {
        await github.postLabel(owner, repo, token, {
          name: apphub.log.label,
          color: apphub.log.color
        })
      } catch (err) {
        log.error('Encountered an error trying to push label')
        log.error(err)

        // return here because if we can't post a label, we won't be able to
        // post an issue
        return this.log('error', 'GitHub/Issue/error.md')
      }
    }

    return Promise.each(logs, (log) => {
      return github.postIssue(owner, repo, token, Object.assign(log, {
        labels: [apphub.log.label]
      }))
    })
    .catch((err) => {
      log.error('Encountered an error trying to push logs')
      log.error(err)

      return this.log('error', 'GitHub/Issue/error.md')
    })
  }
}
