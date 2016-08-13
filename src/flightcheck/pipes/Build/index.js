/*
 * flightcheck/pipes/Build/index.js
 * Builds different types of projects
 *
 * @exports {Pipe} - Builds different types of projects
 */

import path from 'path'

import Pipe from '~/flightcheck/pipes/pipe'

/*
 * Build
 * Builds different types of projects
 *
 * @extends Pipe
 */
export default class Build extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Object} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    // What kind of builds are we running here?
    this.data.types = []

    // All the collected build types
    this.data.files = []
  }

  /**
   * code
   * Builds different types of projects
   *
   * @param {String} p - folder holding the apphub file
   */
  async code (p = 'repository') {
    const cmakeFile = await this.file(path.join(p, 'CMakeLists.txt'))

    if (await cmakeFile.exists()) {
      this.data.types.push('cmake')
    }

    if (this.data.types.length === 0) {
      return this.log('warn', 'Build/support.md')
    }

    await Promise.each(this.data.types, (type) => {
      if (type === 'cmake') {
        return this.require('Liftoff')
      }
    })
    .each((file) => this.data.files.push(file))
  }
}
