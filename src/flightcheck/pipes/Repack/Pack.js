/**
 * flightcheck/pipes/Repack/Pack.js
 * Rebuilds deb files
 *
 * @exports {Class} - Packs a deb file into an installable deb file
 */

import fs from 'fs'
import path from 'path'

import Log from 'lib/log'
import Pipe from 'flightcheck/pipes/pipe'

const log = new Log('flightcheck:Repack:Pack')

/**
 * Pack
 * Packs a deb file into an installable deb file
 */
export default class Pack extends Pipe {

  /**
   * directoryExists
   * Checks that a folder exists.
   *
   * @async
   * @param {string} p - Full path to file
   *
   * @return {void}
   * @throws {Error}
   */
  async directoryExists (p: string) {
    const stat = await new Promise((resolve, reject) => {
      fs.stat(p, (err, stat) => {
        if (err) {
          return reject(err)
        }

        resolve(stat)
      })
    })

    if (stat.isDirectory() === false) {
      throw new Error('Repack file does not exist')
    }
  }

  /**
   * code
   * Packs a deb file into an installable deb file
   *
   * @param {string} p - Path to a package folder relative to build directory
   * @returns {string} - Path to deb file
   */
  async code (p: string) {
    const fullPath = path.join(this.pipeline.build.dir, p)
    await this.fileExists(fullPath)

    log.debug('Running extract script')

    const src = `/tmp/flightcheck/${p}`
    const dest = `/tmp/flightcheck/${p}.deb`

    const returned = await this.docker('repack', ['/usr/local/bin/repack.sh', 'pack', src, dest], undefined, {
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
