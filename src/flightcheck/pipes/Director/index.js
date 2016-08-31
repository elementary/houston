/*
 * flightcheck/pipes/Director/index.js
 * Directs what pipes to run on flightcheck default
 *
 * @exports {Pipe} - Requires pipes based on apphub settings
 */

import Pipe from '~/flightcheck/pipes/pipe'

import log from '~/lib/log'

/*
 * Directory
 * Requires pipes based on apphub settings
 *
 * @extends Pipe
 */
export default class Director extends Pipe {

  /**
   * code
   * Requires pipes based on apphub settings
   */
  async code () {
    const build = await this.require('Build')

    try {
      if (this.pipeline.build.source === 'github') await this.require('GitHubRelease', build.files.map((f) => f.file))
    } catch (err) {
      log.error('Error while trying to publish content to sources')
      log.error(err)
    }
  }
}
