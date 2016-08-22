/**
 * flightcheck/pipes/Debian/Control/index.js
 * Creates a debian/control file for a project
 *
 * @exports {Class} - Creates the debian control file
 */

import path from 'path'

import Pipe from '~/flightcheck/pipes/pipe'

/**
 * DebianControl
 * Creates the debian control file
 */
export default class DebianControl extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Object} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    // The first group is required by Debian law, second is optional, third is just gravy
    this.data.control = {
      Source: pipeline.build.name,
      Maintainer: null,

      Section: null,
      Priority: 'optional',
      'Standards-Version': pipeline.build.version,

      'Vcs-Git': pipeline.build.repo
    }
  }

  /**
   * code
   * Creates the debian control file
   *
   * @param {String} p - folder to create debian folder in
   */
  async code (p = 'repository/debian') {
    const controlPath = path.join(p, 'control')
    const file = await this.file(controlPath, 'colon')

    if (!await file.exists()) {
      return this.log('error', 'Debian/Control/existance.md')
    }

    let contents = null
    try {
      contents = await file.read()
    } catch (e) {
      return this.log('error', 'Debian/Control/parse.md', e)
    }

    const lintedControl = Object.assign({}, this.data.control, contents, {
      'Standards-Version': this.pipeline.build.version
    })
    const errors = []

    /**
     * thr
     * Adds an error to the collection
     *
     * @type {String} err - the message to show on log
     * @type {Boolean} exit - true to stop the build
     */
    const thr = (err, exit = false) => {
      errors.push({
        error: err,
        critical: exit
      })
      if (exit) throw new Error(err)
    }

    try {
      if (lintedControl['Source'] !== this.pipeline.build.name) {
        if (lintedControl['Source'].split('.').length - 1 < 3) {
          thr('Package is not valid reverse domain name scheme')
        } else {
          thr(`Package value should be "${this.pipeline.build.name}"`)
        }

        lintedControl['Source'] = this.pipeline.build.name
      }

      if (lintedControl['Maintainer'] == null) {
        thr('Maintainer has no value', true)
      } else if (!/^.*\s<.*>$/.test(lintedControl['Maintainer'])) {
        thr('Maintainer is not a valid value. Must be in the form of "Maintainer Name <maintainer@email.com>"')
      }
    } catch (e) {
      return this.log('error', 'Debian/Control/error.md', errors)
    }

    if (errors.length > 0) {
      await this.log('warn', 'Debian/Control/warn.md', errors)
    }

    this.data.control = lintedControl
    await file.write(this.data.control)
  }
}
