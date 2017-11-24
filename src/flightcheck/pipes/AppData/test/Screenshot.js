/**
 * flightcheck/pipes/AppData/test/Screenshot.js
 * Checks appdata has at least one screenshot key(s)
 * @flow
 *
 * @exports {Pipe} - Checks appdata has at least one screenshot key
 */

import Parseable from 'flightcheck/file/parsable'
import Pipe from 'flightcheck/pipes/pipe'

/**
 * AppDataScreenshot
 * Checks appdata has at least ont screenshot key
 *
 * @extends Pipe
 */
export default class AppDataScreenshot extends Pipe {

  /**
   * code
   * Checks appdata has at least one screenshot key
   *
   * @param {Parseable} f - The AppData file
   * @returns {Void}
   */
  async code (f: Parseable) {
    const file = await f.parse()

    try {
      if (!file.component.screenshots) {
        throw new Error('Missing screenshots key')
      }

      if (!file.component.screenshots[0].screenshot) {
        throw new Error('Missing screenshot key within screenshots')
      }

      if (file.component.screenshots[0].screenshot.length === 0) {
        throw new Error('Missing screenshot key within screenshots')
      }

      file.component.screenshots[0].screenshot.forEach((screenshot) => {
        if (screenshot.image == null) {
          throw new Error('Missing image key in at least one screenshot')
        }
      })
    } catch (err) {
      return this.log('error', 'AppData/test/screenshot.md')
    }
  }
}
