/**
 * flightcheck/pipes/Desktop/index.js
 * Checks for a valid desktop file
 *
 * @exports {Pipe} - Checks for a valid desktop file
 */

import path from 'path'

import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'

const log = new Log('flightcheck:Desktop')

/**
 * Desktop
 * Checks for a valid desktop file
 *
 * @extends Pipe
 */
export default class Desktop extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Pipeline} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    // Object representation of the desktop file
    this.data.desktop = {}
  }

  /**
   * code
   * Checks for a valid desktop file
   *
   * @param {String} p - folder holding the desktop file
   * @returns {Void}
   */
  async code (p = 'repository/data') {
    const desktopName = `${this.pipeline.build.name}.desktop`
    const desktopPath = path.join(p, desktopName)
    const buildPath = path.join(this.pipeline.build.dir, p)

    const file = await this.file(desktopPath, 'ini')

    if (!await file.exists()) {
      return this.log('error', 'Desktop/existance.md', `${this.pipeline.build.name}.desktop`)
    }

    const returned = await this.docker('util', [desktopName], buildPath)

    if (returned.exit !== 0) {
      try {
        const file = await this.file(returned.log)
        const log = await file.read()

        return this.log('error', 'Desktop/invalid.md', log)
      } catch (e) {
        log.debug('Unable to fetch log of failed Desktop validation')
        log.debug(e)

        return this.log('error', 'Desktop/error.md')
      }
    }
  }
}
