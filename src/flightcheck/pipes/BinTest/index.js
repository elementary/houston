/**
 * flightcheck/pipes/BinTest/index.js
 * Tests a binary is put into /usr/bin directory
 *
 * @exports {Pipe} - Checks for a valid binary file
 */

import path from 'path'
import glob from 'glob'

import Pipe from 'flightcheck/pipes/pipe'

/**
 * AppHub
 * Checks for a valid apphub file
 *
 * @extends Pipe
 */
export default class BinTest extends Pipe {
  /**
   * Returns an array of files in the binary directory
   *
   * @async
   * @param {String} p - path to /usr/bin folder relative to build directory
   * @return {String[]}
   */
  fileInBinDir (p) {
    const g = path.join(this.pipeline.build.dir, p, '**/*')

    return new Promise((resolve, reject) => {
      glob(g, (err, matches) => {
        if (err != null) {
          return reject(err)
        }

        return resolve(matches)
      })
    })
  }

  /**
   * code
   * Checks for a valid binary file
   *
   * @param {String} p - path to /usr/bin folder relative to build directory
   * @returns {Void}
   */
  async code (p) {
    const files = await this.fileInBinDir(p)

    const binaryFile = files.find((file) => {
      return (file === path.join(this.pipeline.build.dir, p, this.pipeline.build.name))
    })

    if (binaryFile == null) {
      if (files.length > 0) {
        return this.log('error', 'BinTest/rename.md', this.pipeline.build.name)
      }

      return this.log('error', 'BinTest/existance.md', this.pipeline.build.name)
    }
  }
}
