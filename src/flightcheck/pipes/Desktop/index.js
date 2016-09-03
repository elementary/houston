/**
 * flightcheck/pipes/Desktop/index.js
 * Checks for a valid desktop file
 *
 * @exports {Pipe} - Checks for a valid desktop file
 */

import path from 'path'

import Pipe from '~/flightcheck/pipes/pipe'

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
  }

  /**
   * code
   * Checks for a valid desktop file
   *
   * @param {String} p - folder holding the desktop file
   */
  async code (p = 'repository') {
    const desktopPath = path.join(p, 'data', this.pipeline.build.name+'.desktop')
    const file = await this.file(desktopPath, 'ini')

    if (!await file.exists()) {
      return this.log('warn', 'Desktop/existance.md')
    }

    let data = null
    try {
      data = await file.read()
    } catch (e) {
      return this.log('error', 'AppHub/parse.md', e)
    }

    const entry = data['Desktop Entry']
    if (!entry) {
      return this.log('error', 'AppHub/entry.md')
    }
  }
}
