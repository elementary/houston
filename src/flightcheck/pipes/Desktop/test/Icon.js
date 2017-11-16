/**
 * flightcheck/pipes/Desktop/test/Icon.js
 * Checks desktop has icon key and matches the RDNN
 * @flow
 *
 * @exports {Pipe} - Checks desktop has icon key and matches the RDNN
 */

import Parseable from 'flightcheck/file/parsable'
import Pipe from 'flightcheck/pipes/pipe'

/**
 * DesktopIcon
 * Checks desktop has icon key and matches the RDNN
 *
 * @extends Pipe
 */
export default class DesktopIcon extends Pipe {

  /**
   * code
   * Checks desktop has icon key and matches the RDNN
   *
   * @param {Parseable} f - The Desktop file
   * @returns {Void}
   */
  async code (f: Parseable) {
    const file = await f.parse()
    const expectedIcon = `${this.pipeline.build.name}`

    try {
      if (!file['Desktop Entry'] || !file['Desktop Entry']['Icon']) {
        throw new Error('Missing icon')
      }
    } catch (err) {
      return this.log('error', 'Desktop/test/icon.md', expectedIcon)
    }

    try {
      if (file['Desktop Entry']['Icon'] !== expectedIcon) {
        throw new Error(`Icon value is unexpected. Should be ${expectedIcon}`)
      }
    } catch (err) {
      return this.log('error', 'Desktop/test/icon.md', expectedIcon)
    }
  }
}
