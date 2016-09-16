/**
 * flightcheck/pipes/AppData/index.js
 * Checks for a valid appdata file
 *
 * @exports {Pipe} - Checks for a valid appdata file
 */

import path from 'path'

import log from '~/lib/log'
import Pipe from '~/flightcheck/pipes/pipe'

/**
 * AppData
 * Checks for a valid appdata file
 *
 * @extends Pipe
 */
export default class AppData extends Pipe {

  /**
   * code
   * Checks for a valid appdata file
   * TODO: create a docker image for appstream-util
   *
   * @param {String} p - folder holding the appdata file
   * @returns {Void}
   */
  async code (p = 'repository/data') {
    const appdataName = `${this.pipeline.build.name}.desktop.appdata.xml`
    const appdataPath = path.join(p, appdataName)
    const buildPath = path.join(this.pipeline.build.dir, p)

    const file = await this.file(appdataPath)

    if (!await file.exists()) {
      return this.log('warn', 'AppData/existance.md')
    }

    const returned = await this.docker('util', ['validate', appdataName], buildPath)

    if (returned.exit !== 0) {
      try {
        const file = await this.file(returned.log)
        const log = await file.read()

        return this.log('warn', 'AppData/invalid.md', log)
      } catch (e) {
        log.debug('Unable to fetch log of failed AppData validation')
        log.debug(e)

        return this.log('warn', 'AppData/invalid.md')
      }
    }
  }
}
