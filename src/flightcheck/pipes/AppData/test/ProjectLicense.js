/**
 * flightcheck/pipes/AppData/test/ProjectLicense.js
 * Checks appdata has project_license key
 * @flow
 *
 * @exports {Pipe} - Checks appdata has project_license key
 */

import Parseable from 'flightcheck/file/parsable'
import Pipe from 'flightcheck/pipes/pipe'

/**
 * AppDataProjectLicense
 * Checks appdata has project_license key
 *
 * @extends Pipe
 */
export default class AppDataProjectLicense extends Pipe {

  /**
   * code
   * Checks appdata has project_license key
   *
   * @param {Parseable} f - The AppData file
   * @returns {Void}
   */
  async code (f: Parseable) {
    const file = await f.parse()

    try {
      if (!file.component.project_license) {
        throw new Error('Missing project_license')
      }

      if (file.component.project_license.length == 0) {
        throw new Error('Empty project_license')
      }
    } catch (err) {
      return this.log('warn', 'AppData/test/projectLicense.md')
    }
  }
}
