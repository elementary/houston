/**
 * flightcheck/pipes/GitHub/Release/index.js
 * Post files to GitHub release
 *
 * @exports {Pipe} - Post files to GitHub release
 */

import path from 'path'

import * as github from 'service/github'
import config from 'lib/config'
import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'

const log = new Log('flightcheck:GitHubRelease')

/**
 * GitHubRelease
 * Post files to GitHub release
 *
 * @extends Pipe
 */
export default class GitHubRelease extends Pipe {

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
   * Post files to GitHub release
   *
   * @param {Object[]} files - a list of files to publish to GitHub
   * @returns {Void}
   */
  async code (files = []) {
    if (this.pipeline.build.source !== 'github') {
      return this.log('debug', 'GitHub/Release/unsupported.md')
    }

    if (this.pipeline.build.auth == null || !config.github.post) {
      return this.log('debug', 'GitHub/Release/disabled.md', !config.github.post)
    }

    log.debug(`GitHubRelease has ${files.length} files to publish`)

    // Filter the github information from the repo url
    // Possible urls are https://github.com/vocalapp/vocal
    // and git@github.com:vocalapp/vocal.git
    // @see Pipeline class for same code
    const splits = this.pipeline.build.repo.split(/(\/|:)/)
    const owner = splits[splits.length - 3].replace('.', '_')
    const repo = splits[splits.length - 1].replace('.git', '').replace('.', '_')

    log.debug(`GitHubRelease found GitHub owner and repo: ${owner}/${repo}`)

    const token = await github.generateToken(Number(this.pipeline.build.auth))

    const releaseId = await github.getReleaseByTag(owner, repo, this.pipeline.build.tag, token)
    .then((res) => Number(res.github.id))
    .catch((err) => {
      log.error('Error while trying to get release id')
      log.error(err)

      return this.log('error', 'GitHub/Release/error.md')
    })

    log.debug(`Found release id: ${releaseId}`)

    const releasedAssets = await github.getAssets(owner, repo, releaseId, token)
    .then((body) => body.map((res) => res.label))
    .catch((err) => {
      log.error('Error while trying to get published assets')
      log.error(err)

      return this.log('error', 'GitHub/Release/error.md')
    })

    log.debug(`Found ${releasedAssets.length} published assets`)

    files.forEach((file) => {
      const abs = path.join(this.pipeline.build.dir, file)

      let label = path.basename(abs)
      let name = `${this.pipeline.build.name}_${this.pipeline.build.version}_${path.basename(abs)}`
      let type = 'application/octet-stream'

      const ext = path.extname(abs)
      if (ext === '.deb') {
        const arch = file.split('_')[2].split('.')[0]

        label = `apphub ${arch} (deb)`
        name = `${this.pipeline.build.name}_${this.pipeline.build.version}_${arch}.deb`
        type = 'application/vnd.debian.binary-package'
      }

      const released = releasedAssets.find((l) => (l === label))
      if (released != null) return // asset with same label is already published

      this.data.published.push({file, label, name, type})
    })

    log.debug(`Publishing ${this.data.published.length} files`)

    return Promise.each(this.data.published, (file) => {
      return github.postFile(owner, repo, releaseId, token, {
        name: file.name,
        label: file.label,
        path: path.join(this.pipeline.build.dir, file.file),
        type: file.type
      })
    })
    .catch((err) => {
      log.error('Error while trying to push files')
      log.error(err)

      return this.error('error', 'GitHub/Release/error.md')
    })
  }
}
