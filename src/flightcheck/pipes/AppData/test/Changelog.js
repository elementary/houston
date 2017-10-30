/**
 * flightcheck/pipes/AppData/test/changelog.js
 * Checks appdata has screenshot key
 * @flow
 *
 * @exports {Pipe} - Checks appdata has screenshot key
 */

import Parseable from 'flightcheck/file/parsable'
import Pipe from 'flightcheck/pipes/pipe'

/**
 * AppDataChangelog
 * Checks appdata has screenshot key
 *
 * @extends Pipe
 */
export default class AppDataChangelog extends Pipe {

  /**
   * code
   * Checks appdata has screenshot key
   *
   * @param {Parseable} f - The AppData file
   * @returns {Void}
   */
  async code (f: Parseable) {
    const file = await f.parse()

    try {
      file.component.releases[0].release.forEach((release) => {
        if (release.description == null) {
          throw new Error('Missing changelog')
        }
      })
    } catch (err) {
      return this.log('error', 'AppData/test/changelog.md')
    }
  }
}
