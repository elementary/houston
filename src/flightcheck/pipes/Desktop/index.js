/**
 * flightcheck/pipes/Desktop/index.js
 * Checks for a valid desktop file
 *
 * @exports {Pipe} - Checks for a valid desktop file
 */

import path from 'path'

import Pipe from 'flightcheck/pipes/pipe'

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
    const desktopPath = path.join(p, `${this.pipeline.build.name}.desktop`)
    const file = await this.file(desktopPath, 'ini')

    if (!await file.exists()) {
      return this.log('error', 'Desktop/existance.md')
    }

    try {
      this.data.desktop = await file.read()
    } catch (e) {
      return this.log('error', 'Desktop/parse.md', e)
    }

    if (this.data.desktop['Desktop Entry'] == null) {
      return this.log('error', 'AppHub/entry.md')
    }
  }
}
