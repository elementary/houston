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
   * @param {string} p - Relative path to a package folder
   * @returns {string} - Relative path to deb file
   */
  async code (p: string) {
    await this.directoryExists(path.resolve(this.pipeline.build.dir, p))

    log.debug('Running pack script')

    const filename = path.basename(p)
    const src = path.resolve('/tmp/flightcheck', p)
    const dest = path.resolve('/tmp/flightcheck', `${filename}.deb`)

    const returned = await this.docker('repack', ['/usr/local/bin/repack.sh', 'pack', src, dest], undefined, {
      Image: 'flightcheck-repack-repack',
      Privileged: true // required to avoid file permission changes
    })

    if (returned.exit !== 0) {
      log.debug(`Repack pack returned ${returned.exit} exit code`)

      return this.log('error', 'Repack/failure.md')
    }

    this.data = `${filename}.deb`
    return this.data
  }
}
