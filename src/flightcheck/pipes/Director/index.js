/*
 * flightcheck/pipes/Director/index.js
 * Directs what pipes to run on flightcheck default
 *
 * @exports {Pipe} - Requires pipes based on apphub settings
 */

import path from 'path'

import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'

const log = new Log('flightcheck:Director')

/**
 * Directory
 * Requires pipes based on apphub settings
 *
 * @extends Pipe
 */
export default class Director extends Pipe {

  /**
   * code
   * Requires pipes based on apphub settings
   *
   * @returns {Void}
   */
  async code () {
    const apphub = await this.require('AppHub')

    await this.require('Desktop')
    await this.require('AppData')

    try {
      const build = await this.require('Build')

      const files = build.files.map((f) => f.file).filter((f) => (f != null))
      const debFiles = files.filter((f) => (f != null && path.extname(f) === '.deb'))

      if (apphub.endpoints.github && this.pipeline.build.source === 'github') await this.require('GitHubRelease', files)
      if (apphub.endpoints.elementary) await this.require('ElementaryAptly', debFiles)
    } catch (err) {
      if (err.code === 'PIPER') return

      log.error('Error while trying to publish content to sources')
      log.error(err)
    }

    try {
      if (apphub.log.enabled && this.pipeline.build.source === 'github') await this.require('GitHubIssue')
    } catch (err) {
      if (err.code === 'PIPER') return

      log.error('Error while trying to publish results to sources')
      log.error(err)
    }
  }
}
