/**
 * houston/src/worker/task/debian/control.ts
 * Updates, lints, and validates the Debian control file.
 */

import * as fs from 'fs-extra'
import { get, set } from 'lodash'
import * as os from 'os'
import * as path from 'path'

import { sanitize } from '../../../lib/utility/rdnn'
import { Log } from '../../log'
import { Task } from '../task'

export class DebianControl extends Task {

  /**
   * File location for the debian control file
   *
   * @var {string}
   */
  public static path = 'debian/control'

  /**
   * The Debian package name
   *
   * @return {String}
   */
  protected get name () {
    return sanitize(this.worker.context.nameDomain, '-')
  }

  /**
   * Returns the full path for the debian control file and the current test.
   *
   * @return {String}
   */
  protected get path () {
    return path.resolve(this.worker.workspace, 'dirty', DebianControl.path)
  }

  /**
   * Checks the Debian control file for errors
   *
   * @async
   * @return {void}
   */
  public async run () {
    const exists = fs.pathExists(this.path)
    if (exists === false) {
      throw new Log(Log.Level.ERROR, 'Missing debian control file')
    }

    const file = await fs.readFile(this.path, 'utf8')

    const errors = [] as string[]

    // TODO: Remove after Cody migrates everything to correct RDNN
    if (this.worker.context.type !== 'system-app') {
      if (file.indexOf(`Source: ${this.name}`) === -1) {
        errors.push(`Source should be "${this.name}"`)
      }

      if (file.indexOf(`Package: ${this.name}`) === -1) {
        errors.push(`Package should be "${this.name}"`)
      }

      if (!file.match(/^Maintainer: .* <.*@.*>$/gm)) {
        errors.push('Maintainer should be in the form of "name <email@example.com"')
      }
    }

    if (errors.length > 0) {
      const template = path.resolve(__dirname, 'control.md')

      throw Log.template(Log.Level.ERROR, template, {
        context: this.worker.context,
        errors
      })
    }
  }
}
