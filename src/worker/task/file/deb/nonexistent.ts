/**
 * houston/src/worker/task/file/deb/binary.ts
 * Tests debian packages for needed binary file
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { glob } from '../../../../lib/utility/glob'
import { Log } from '../../../log'
import { Task } from '../../task'

export class FileDebNonexistent extends Task {
  /**
   * Folder where non-correctly installed files will end up in the Debian package
   *
   * @return {string}
   */
  protected get path () {
    return path.resolve(this.worker.workspace, 'package')
  }

  /**
   * Glob for non-correctly installed files
   *
   * @return {string}
   */
  protected get files () {
    return path.resolve(this.path, 'package/nonexistent/**/*')
  }

  /**
   * Checks no files are incorrectly placed in the deb package
   *
   * @async
   * @return {void}
   */
  public async run () {
    const files = await glob(this.files)

    if (files.length < 1) {
      return
    }

    const relativePaths = files.map((file) => file.replace(`${this.path}/`, ''))

    const p = path.resolve(__dirname, 'nonexistentLog.md')
    const log = await fs.readFile(p, 'utf8')

    throw Log.template(Log.Level.ERROR, p, {
      files: relativePaths,
      storage: this.worker.storage
    })
  }
}
