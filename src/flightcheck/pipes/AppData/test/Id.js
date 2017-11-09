/**
 * flightcheck/pipes/AppData/test/Id.js
 * Checks appdata has id key and matches the RDNN
 * @flow
 *
 * @exports {Pipe} - Checks appdata has id key and matches the RDNN
 */

import Parseable from 'flightcheck/file/parsable'
import Pipe from 'flightcheck/pipes/pipe'

/**
 * AppDataId
 * Checks appdata has id key and matches the RDNN
 *
 * @extends Pipe
 */
export default class AppDataId extends Pipe {

  /**
   * code
   * Checks appdata has id key and matches the RDNN
   *
   * @param {Parseable} f - The AppData file
   * @returns {Void}
   */
  async code (f: Parseable) {
    const file = await f.parse()
    const expectedId = `${this.pipeline.build.name}.desktop`

    try {
      if (!file.component.id) {
        throw new Error('Missing id')
      }
    } catch (err) {
      return this.log('warn', 'AppData/test/id.md', this.pipeline.build.name)
    }

    try {
      if (file.component.id[0] !== expectedId) {
        throw new Error(`Id [${file.component.id[0]}] does not match expected RDNN [${expectedId}]`)
      }
    } catch (err) {
      return this.log('warn', 'AppData/test/id.md', this.pipeline.build.name)
    }
  }
}
