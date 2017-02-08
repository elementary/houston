/**
 * flightcheck/file/index.js
 * A high level class for file interaction
 * @flow
 *
 * @exports {Class} File - high level interaction of files
 */

import path from 'path'
import Promise from 'bluebird'
import glob from 'glob'

import * as fsHelpers from 'lib/helpers/fs'

const fs = Promise.promisifyAll(require('fs'))

/**
 * File
 * High level interaction of files
 *
 * @property {String} type - File extension
 */
export default class File {

  _glob: string
  _match: Function
  _path: string

  type: string

  /**
   * Creates a file class
   *
   * @param {String} p - Perfect path to file
   * @param {String} [glob] - Glob search for alternative files
   * @param {Function} [matchFN] - Function to select correct file from glob search
   */
  constructor (p: string, glob?: string, matchFN: Function = (ps) => ps[0]) {
    this._match = matchFN
    this._path = p

    if (glob != null) this._glob = glob

    this.type = path.extname(p).replace('.', '').toLowerCase()
  }

  /**
   * exists
   * Checks if the file currently exists
   *
   * @async
   *
   * @returns {String|null} - String of path found, or null if it does not exist
   */
  async exists (): Promise<string|null> {
    const pathExists = await fs.statAsync(this._path)
    .then((stat) => stat.isFile())
    .catch({ code: 'ENOENT' }, () => false)

    if (pathExists) return this._path
    if (this._glob == null) return null

    const globPaths = await new Promise((resolve, reject) => {
      glob(this._glob, (err, files) => {
        if (err) return reject(err)
        return resolve(files)
      })
    })

    if (globPaths.length < 1) return null

    return this._match(globPaths)
  }

  /**
   * read
   * Reads file
   *
   * @async
   *
   * @returns {String|null} - file output or null if it does not exist
   */
  async read (): Promise<string|null> {
    const currentPath = await this.exists()
    if (currentPath == null) return null

    return fs.readFileAsync(currentPath, { encoding: 'utf8' })
  }

  /**
   * write
   * Writes to file
   *
   * @async
   *
   * @param {String} data - data to write to file
   *
   * @returns {Void}
   */
  async write (data: string): Promise<> {
    let currentPath = await this.exists()
    if (currentPath == null) {
      currentPath = this._path
      await fsHelpers.mkdirp(path.dirname(currentPath))
    }

    await fs.writeFileAsync(currentPath, data)
  }
}
