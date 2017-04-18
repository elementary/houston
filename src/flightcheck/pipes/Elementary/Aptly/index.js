/*
 * flightcheck/pipes/Elementary/Aptly/index.js
 * Publishes builds to elementary's aptly repo
 *
 * @exports {Pipe} - Post to
 */

import _ from 'lodash'
import path from 'path'

import * as aptly from 'service/aptly'
import config from 'lib/config'
import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'

const log = new Log('flightcheck:ElementaryAptly')

/**
 * GitHubRelease
 * Post files to GitHub release
 *
 * @extends Pipe
 */
export default class ElementaryAptly extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Pipeline} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    // TODO: we need to filter by architectures
    this.data.archs = ['amd64'] // elementary architectures we publish for
    this.data.dists = ['xenial'] // elementary repository distributions we publish for

    this.data.publishedKeys = [] // all aptly keys we published
  }

  /**
   * code
   * Create GitHub Issues
   *
   * @param {Array} files - paths of files to upload to GitHub relative to build dir
   * @returns {Void}
   */
  async code (files = []) {
    files = files.filter((f) => (path.extname(f) === '.deb'))

    log.debug(`ElementaryAptly has ${files.length} files to publish`)

    if (files.length < 1) return

    if (!config.aptly || !config.aptly.url) return this.log('debug', 'Elementary/Aptly/disabled.md')

    const apphub = await this.require('AppHub')

    if (!apphub.endpoints.elementary) {
      log.debug('ElementaryAptly endpoint is disabled in apphub file')
      return this.log('debug', 'Elementary/Aptly/disabled.md')
    }

    let existingKeys = null
    try {
      log.debug('ElementaryAptly is trying to check for existing packages')

      existingKeys = await aptly.get(config.aptly.review, this.pipeline.build.name, this.pipeline.build.version)

      if (!_.isArray(existingKeys)) throw new Error('Unable to grab array of exisiting keys')
    } catch (error) {
      log.error(error)
      return this.log('error', 'Elementary/Aptly/api.md')
    }

    if (existingKeys.length > 0) {
      log.debug('ElementaryAptly has detected this project and version are already uploaded')
      return this.log('warn', 'Elementary/Aptly/existing.md')
    }

    try {
      log.debug(`ElementaryAptly is uploading ${files} files to aptly`)

      const promises = []
      files.forEach((file) => {
        const p = path.resolve(this.pipeline.build.dir, file)
        promises.push(aptly.review(this.pipeline.build.name, this.pipeline.build.version, p))
      })
      const keys = await Promise.all(promises)

      this.data.publishedFiles = _.flattenDeep(keys)
    } catch (error) {
      log.error(error)
      return this.log('error', 'Elementary/Aptly/api.md')
    }
  }
}
