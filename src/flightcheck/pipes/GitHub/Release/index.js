/*
 * flightcheck/pipes/GitHub/Release/index.js
 * Post files to GitHub release
 *
 * @exports {Pipe} - Post files to GitHub release
 */

import path from 'path'

import config from '~/lib/config'
import log from '~/lib/log'
import Pipe from '~/flightcheck/pipes/pipe'
import request from '~/lib/request'

/*
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

    let releaseId = null
    try {
      releaseId = await request
      .get(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${this.pipeline.build.tag}`)
      .auth(this.pipeline.build.auth)
      .then((res) => res.body.id)

      log.debug(`GitHubRelease found release id: ${releaseId}`)
    } catch (err) {
      log.error('GitHubRelease errored while trying to get release id')
      log.error(err)
      return this.log('error', 'GitHub/Release/api.md')
    }

    let releasedAssets = null
    try {
      releasedAssets = await request
      .get(`https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets`)
      .auth(this.pipeline.build.auth)
      .then((res) => res.body)
      .map((release) => release.label)

      log.debug(`GitHubRelease found ${releasedAssets.length} published assets`)
    } catch (err) {
      log.error('GitHubRelease errored while trying to get published assets')
      log.error(err)
      return this.log('error', 'GitHub/Release/api.md')
    }

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

    try {
      log.debug(`GitHubRelease publishing ${this.data.published.length} files`)

      return Promise.each(this.data.published, async (file) => {
        return request // Keep it in a promise so we can execute in parallel
        .post(`https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets`)
        .query({
          name: file.name,
          label: file.label
        })
        .auth(this.pipeline.build.auth)
        .attach('file', path.join(this.pipeline.build.dir, file.file), file.name)
      })
    } catch (err) {
      log.error('GitHubRelease encountered an error while trying to publish files')
      log.error(err)
      return this.error('error', 'GitHub/Release/error.md')
    }
  }
}
