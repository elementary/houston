/**
 * flightcheck/file/parsable.js
 * A high level class for file interaction on known file syntaxes
 *
 * @exports {Class} Parsable - high level interaction of parsable files
 */

import * as parser from './parsers'
import File from './index'

/**
 * Parsable
 * High level interaction of parsable files
 */
export default class Parsable extends File {

  /**
   * Creates a file class
   *
   * @param {String} p - Path to the file
   * @param {String} t - Type of file
   */
  constructor (p, t) {
    super(p)

    if (parser[t] == null) {
      throw new Error('Unable to parse unknown file type')
    }

    this.type = t
  }

  /**
   * parse
   * Reads file and tries to parse it
   *
   * @returns {Object} - file output or empty object if it does not exist
   */
  async parse () {
    const data = await this.read()
    if (data == null) return {}

    // Only whitespace exists
    if (!/\S/.test(data)) return {}
    return parser[this.type].read(data)
  }

  /**
   * stringify
   * Writes javascript object to file
   *
   * @param {Object} data - data to write to file
   *
   * @returns {Void}
   */
  async stringify (data) {
    if (typeof data !== 'string') {
      throw new Error('File requires data to stringify')
    }

    const str = await parser[this.type].write(data)
    return this.write(str)
  }
}
