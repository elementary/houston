/**
 * flightcheck/pipes/AppData/test/changelog.js
 * Checks appdata has changelog key
 * @flow
 *
 * @exports {Pipe} - Checks appdata has changelog key
 */

import Parseable from 'flightcheck/file/parsable'
import Pipe from 'flightcheck/pipes/pipe'

/**
 * AppDataChangelog
 * Checks appdata has changelog key
 *
 * @extends Pipe
 */
export default class AppDataChangelog extends Pipe {

  /**
   * code
   * Checks appdata has changelog key
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
      return this.log('warn', 'AppData/test/changelog.md')
    }
  }
}
