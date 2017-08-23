/**
 * houston/src/worker/task/debian/control.ts
 * Updates, lints, and validates the Debian control file.
 *
 * @exports {Function} run - Update, lint and validate control file.
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'

import { Log } from '../../log'
import { Task } from '../task'
import { ControlParser } from './controlParser'

export class DebianControl extends Task {

  /**
   * File location for the debian control file
   *
   * @var {string}
   */
  public static path = 'debian/control'

  /**
   * A list used files we need to verify the Debian control file
   *
   * @var {string[]}
   */
  public files = [DebianControl.path]

  /**
   * The parser to use when doing stuff to the debian control file
   *
   * @var {ControlParser}
   */
  public parser = ControlParser

  /**
   * Checks the Debian control file for errors
   *
   * @async
   * @return {void}
   */
  public async run () {
    const exists = fs.pathExists(DebianControl.path)
    if (exists === false) {
      throw new Log(Log.Level.ERROR, 'Missing debian control file')
    }


  }
}
