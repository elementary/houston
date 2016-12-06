/**
 * flightcheck/pipes/AppData/index.js
 * Checks for a valid appdata file
 *
 * @exports {Pipe} - Checks for a valid appdata file
 */

import path from 'path'

import config from 'lib/config'
import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'

const log = new Log('flightcheck:AppData')

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
    const appdataName = `${this.pipeline.build.name}.appdata.xml`
    const appdataPath = path.join(p, appdataName)
    const buildPath = path.join(this.pipeline.build.dir, p)

    const file = await this.file(appdataPath, 'xml')

    if (!await file.exists()) {
      return this.log('warn', 'AppData/existance.md', `${this.pipeline.build.name}.appdata.xml`)
    }

    const returned = await this.docker('util', ['validate', appdataName, '--no-color'], buildPath)

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

    if (this.pipeline.build.stripe != null) {
      log.debug('Saving donation url to appstream file')
      this.data = await file.read()

      let i = 0
      if (this.data['component']['url'] != null) i = this.data['component']['url'].length

      this.data['component']['url'][i] = {
        '_': `${config.server.url}/purchase/${this.pipeline.build.stripe}`,
        '$': {
          type: 'donation'
        }
      }

      try {
        await file.write(this.data)
      } catch (err) {
        log.warn('Unable to save donation url to AppData')
        log.warn(err)
        log.report(err, this.pipeline.build)
      }
    }
  }
}
