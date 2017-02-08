/**
 * flightcheck/file/parsable.js
 * A high level class for file interaction on known file syntaxes
 * @flow
 *
 * @exports {Class} Parsable - high level interaction of parsable files
 */

import * as parser from './parsers'
import File from './index'

/**
 * Parsable
 * High level interaction of parsable files
 *
 * @extends File
 */
export default class Parsable extends File {

  /**
   * Creates a file class
   *
   * @param {String} p - Path to the file
   * @param {String} [glob] - Glob search for alternative files
   * @param {String} [type] - File type to use for parsing
   * @param {Function} [matchFN] - Function to select correct file from glob search
   */
  constructor (p: string, glob?: string, type?: string, matchFN?: Function) {
    super(p, glob, matchFN)

    if (type != null) this.type = type

    if (parser[this.type] == null) {
      throw new Error('Unable to parse unknown file type')
    }
  }

  /**
   * parse
   * Reads file and tries to parse it
   *
   * @async
   *
   * @returns {Object} - file output or empty object if it does not exist
   */
  async parse (): Promise<Object> {
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
   * @async
   *
   * @param {Object} data - data to write to file
   *
   * @returns {Void}
   */
  async stringify (data: Object): Promise<> {
    const str = await parser[this.type].write(data)
    return this.write(str)
  }
}
