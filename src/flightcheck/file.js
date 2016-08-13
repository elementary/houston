/**
 * flightcheck/file.js
 * A high level class for file interaction
 *
 * @exports {Class} File - high level interaction of files
 */

import assert from 'assert'
import path from 'path'
import Promise from 'bluebird'

import * as fsHelpers from '~/lib/helpers/fs'
import * as parses from './parsers'

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
   * @param {String} [type=raw] - Type of parser to use for file
   * @param {String} [encoding=utf-8] - File encoding to use for the file
   */
  constructor (p, type, encoding = 'utf-8') {
    assert(p, 'File requires a path')

    this.path = path.resolve(p)
    this.type = type
    this.options = { encoding }

    if (type != null) {
      assert(parses[type], `File type "${type}" does not exist`)
    }
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
   * Reads file from path and parses it if type is set
   *
   * @param {String} [type=this.type] - file type to parse as
   * @returns {Object} - javascript object reporesentation of file
   */
  async read (type = this.type) {
    const existance = await this.exists()

    if (!existance) return null

    const raw = await fs.readFileAsync(this.path, this.options)

    // If it's a file with only whitespace charactors (no real data)
    if (!/\S/.test(raw)) return {}

    if (type) {
      return parses[type].read(raw)
    } else {
      return raw
    }
  }

  /**
   * write
   * Writes javascript object to file
   *
   * @param {Object} data - data to write to file
   * @param {String} [type=this.type] - file type to write as
   * @returns {Void}
   */
  async write (data, type = this.type) {
    assert(data, 'File requires something to write')

    let output = data

    if (type) {
      output = await parses[type].write(data)
    }

    await fsHelpers.mkdirp(path.dirname(this.path))
    await fs.writeFileAsync(this.path, output)
  }
}
