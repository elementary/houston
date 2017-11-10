/**
 * flightcheck/pipes/AppData/test/DeveloperName.js
 * Checks appdata has developer_name
 * @flow
 *
 * @exports {Pipe} - Checks appdata has developer_name
 */

import Parseable from 'flightcheck/file/parsable'
import Pipe from 'flightcheck/pipes/pipe'

/**
 * AppDataDeveloperName
 * Checks appdata has developer_name
 *
 * @extends Pipe
 */
export default class AppDataDeveloperName extends Pipe {

  /**
   * code
   * Checks appdata has developer_name
   *
   * @param {Parseable} f - The AppData file
   * @returns {Void}
   */
  async code (f: Parseable) {
    const file = await f.parse()

    try {
      if (!file.component.developer_name) {
        throw new Error('Missing developer_name')
      }
    } catch (err) {
      return this.log('error', 'AppData/test/developerName.md')
    }
  }
}
