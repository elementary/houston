/**
 * flightcheck/pipes/Desktop/index.js
 * Checks for a valid desktop file
 *
 * @exports {Pipe} - Checks for a valid desktop file
 */

import path from 'path'

import File from 'flightcheck/file'
import Log from 'lib/log'
import Parsable from 'flightcheck/file/parsable'
import Pipe from 'flightcheck/pipes/pipe'

const log = new Log('flightcheck:Desktop')

/**
 * Desktop
 * Checks for a valid desktop file
 *
 * @extends Pipe
 */
export default class Desktop extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Pipeline} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    // Object representation of the desktop file
    this.data.desktop = {}
  }

  /**
   * code
   * Checks for a valid desktop file
   *
   * @param {String} p - folder holding the desktop file
   * @returns {Void}
   */
  async code (p = 'repository/data') {
    const desktopName = `${this.pipeline.build.name}.desktop`
    const globName = '**/*desktop'

    const desktopPath = path.join(p, desktopName)
    const globPath = path.join(p, globName)

    const desktopAbsPath = path.join(this.pipeline.build.dir, desktopPath)
    const globAbsPath = path.join(this.pipeline.build.dir, globPath)

    const file = new Parsable(desktopAbsPath, globAbsPath, 'ini')
    const fileFound = await file.exists()

    if (fileFound == null) {
      return this.log('warn', 'AppData/existance.md', desktopName)
    } else {
      this.data.desktop = await file.parse()
    }

    const filePath = path.relative(this.pipeline.build.dir, fileFound)
    const returned = await this.docker('util', [filePath])

    if (returned.exit !== 0) {
      try {
        const file = new File(path.resolve(this.pipeline.build.dir, returned.log))
        const log = await file.read()

        return this.log('error', 'Desktop/invalid.md', log)
      } catch (e) {
        log.debug('Unable to fetch log of failed Desktop validation')
        log.debug(e)

        return this.log('error', 'Desktop/error.md')
      }
    }
  }
}
