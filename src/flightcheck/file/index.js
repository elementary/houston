/**
 * flightcheck/file/index.js
 * A high level class for file interaction
 *
 * @exports {Class} File - high level interaction of files
 */

import path from 'path'
import Promise from 'bluebird'

import * as fsHelpers from 'lib/helpers/fs'

const fs = Promise.promisifyAll(require('fs'))

/**
 * File
 * High level interaction of files
 */
export default class File {

  /**
   * Creates a file class
   *
   * @param {String} p - Path to the file
   */
  constructor (p) {
    if (typeof p !== 'string') {
      throw new Error('File requires a path')
    }

    this.path = path.resolve(p)
  }

  /**
   * exists
   * Checks if the file currently exists
   *
   * @returns {Boolean} - true if file exists
   */
  exists () {
    return fs.statAsync(this.path)
    .then((stat) => stat.isFile())
    .catch({ code: 'ENOENT' }, () => false)
  }

  /**
   * read
   * Reads file
   *
   * @returns {String} - file output or null if it does not exist
   */
  async read () {
    if (!await this.exists()) return null

    return fs.readFileAsync(this.path, { encoding: 'utf8' })
  }

  /**
   * write
   * Writes to file
   *
   * @param {String} data - data to write to file
   *
   * @returns {Void}
   */
  async write (data) {
    if (typeof data !== 'string') {
      throw new Error('File requires data to write')
    }

    await fsHelpers.mkdirp(path.dirname(this.path))
    await fs.writeFileAsync(this.path, data)
  }
}
