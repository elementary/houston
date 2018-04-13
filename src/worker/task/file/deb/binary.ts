/**
 * houston/src/worker/task/file/deb/binary.ts
 * Tests debian packages for needed binary file
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { glob } from '../../../../lib/utility/glob'
import { Log } from '../../../log'
import { Task } from '../../task'

export class FileDebBinary extends Task {
  /**
   * Location of the directory to build
   *
   * @return {string}
   */
  protected get path () {
    return path.resolve(this.worker.workspace, 'package/usr/bin', this.worker.context.nameDomain)
  }

  /**
   * Runs liftoff
   *
   * @async
   * @return {void}
   */
  public async run () {
    const exists = await fs.exists(this.path)

    if (exists === false) {
      throw new Log(Log.Level.ERROR, `Missing shipped binary at /usr/bin/${this.worker.context.nameDomain}`)
    }
  }
}
