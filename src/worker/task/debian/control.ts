/**
 * houston/src/worker/task/debian/control.ts
 * Updates, lints, and validates the Debian control file.
 */

import * as fs from 'fs-extra'
import { get, set } from 'lodash'
import * as os from 'os'
import * as path from 'path'

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

    // TODO: Use regex to do the following checks
    //   Source should be nameDomain with dashes
    //   Maintainer should match "Name <email@mail.com>"
    //   Package should be nameDomain with dashes
  }
}
