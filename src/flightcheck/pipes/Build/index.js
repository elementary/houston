/*
 * flightcheck/pipes/Build/index.js
 * Builds different types of projects
 *
 * @exports {Pipe} - Builds different types of projects
 */

import path from 'path'

import File from 'flightcheck/file'
import Pipe from 'flightcheck/pipes/pipe'

/**
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
   * @returns {Void}
   */
  async code (p = 'repository') {
    const debianFile = new File(path.join(this.pipeline.build.dir, p, 'debian', 'control'))

    if (await debianFile.exists() != null) {
      this.data.types.push('debian')
    }

    if (this.data.types.length === 0) {
      return this.log('warn', 'Build/support.md')
    }

    this.data.files = await Promise.map(this.data.types, (type) => {
      if (type === 'debian') {
        return this.require('Liftoff')
      }
    })
  }
}
