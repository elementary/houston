/**
 * flightcheck/pipes/Repack/Extract.js
 * Extracts deb files
 *
 * @exports {Class} - Extracts and rebuilds deb files
 */

import fs from 'fs'
import path from 'path'

import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'

const log = new Log('flightcheck:Repack:Extract')

/**
 * Extract
 * Extracts the deb file into editable files
 */
export default class Extract extends Pipe {

  /**
   * fileExists
   * Checks that a file exists.
   *
   * @async
   * @param {string} p - Full path to file
   *
   * @return {void}
   * @throws {Error}
   */
  async fileExists (p: string) {
    const stat = await new Promise((resolve, reject) => {
      fs.stat(p, (err, stat) => {
        if (err) {
          return reject(err)
        }

        resolve(stat)
      })
    })

    if (stat.isFile() === false) {
      throw new Error('Repack file does not exist')
    }
  }

  /**
   * code
   * Extracts the deb file into editable files
   *
   * @param {string} p - Path to the deb file relative to pipeline workspace
   * @returns {string} - Path to extracted folder
   */
  async code (p: string) {
    const fullPath = path.join(this.pipeline.build.dir, p)
    await this.fileExists(fullPath)

    log.debug('Running extract script')

    const filename = path.basename(p)
    const src = `/tmp/flightcheck/repository/${filename}`
    const dest = `/tmp/flightcheck/${filename.slice(0, -4)}`

    const returned = await this.docker('repack', ['/usr/local/bin/repack.sh', 'extract', src, dest], undefined, {
      Image: 'flightcheck-repack-repack',
      Privileged: true // required to avoid file permission changes
    })

    if (returned.exit !== 0) {
      log.debug(`Repack returned ${returned.exit} exit code`)

      return this.log('error', 'Repack/failure.md')
    }

    return dest
  }
}
