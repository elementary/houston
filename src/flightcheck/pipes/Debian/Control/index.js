/**
 * flightcheck/pipes/Debian/Control/index.js
 * Creates a debian/control file for a project
 *
 * @exports {Class} - Creates the debian control file
 */

import fs from 'lib/helpers/fs'
import path from 'path'

import Pipe from 'flightcheck/pipes/pipe'

/**
 * DebianControl
 * Creates the debian control file
 */
export default class DebianControl extends Pipe {
  /**
   * code
   * Creates the debian control file
   *
   * @param {String} p - folder to create debian folder in
   * @returns {Void}
   */
  async code (p = 'repository/debian') {
    const controlPath = path.join(this.pipeline.build.dir, p, 'control')

    if (await fs.exists(controlPath) === false) {
      return this.log('error', 'Debian/Control/existance.md')
    }

    const file = await fs.readFile(controlPath, 'utf8')
    const errors = []

    // Ensure the Source field in the file matches the build name
    if (file.indexOf(`Source: ${this.pipeline.build.name}`) === -1) {
      errors.push(`Source is not correct. It should be "${this.pipeline.build.name}"`)
    }

    // Ensure the maintainer field is set correctly
    if (!/^Maintainer:/gmi.test(file)) {
      errors.push('Maintainer value is missing')
    } else if (!/^Maintainer: .+ <.+>$/gmi.test(file)) {
      errors.push('Maintainer is not a valid value. Must be in the form of "Maintainer Name <maintainer@email.com>"')
    }

    // Ensure the package name is correct
    if (file.indexOf(`Package: ${this.pipeline.build.name}`) === -1) {
      errors.push(`Package is incorrect. It should be "${this.pipeline.build.name}"`)
    }

    if (errors.length > 0) {
      return this.log('error', 'Debian/Control/error.md', errors)
    }
  }
}
