/**
 * houston/src/worker/task/file/deb/binary.ts
 * Tests debian packages for needed binary file
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { glob } from '../../../../lib/utility/glob'
import { sanitize } from '../../../../lib/utility/rdnn'
import { Log } from '../../../log'
import { Task } from '../../task'

export class FileDebBinary extends Task {

  /**
   * Returns the desktop file name
   *
   * @return {string}
   */
  public get name () {
    return sanitize(this.worker.context.nameDomain, '-')
  }

  /**
   * Location of the directory to build
   *
   * @return {string}
   */
  protected get path () {
    return path.resolve(this.worker.workspace, 'package/usr/bin', this.name)
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
      throw Log.template(Log.Level.ERROR, path.resolve(__dirname, 'binary.md'), {
        context: this.worker.context,
        files: await this.files(),
        name: this.name
      })
    }
  }

  /**
   * Returns a list of useful files in the package. Filters out custom files
   *
   * @async
   * @return {string[]}
   */
  protected async files (): Promise<string[]> {
    const root = path.resolve(this.worker.workspace, 'package')
    const files = await glob(path.resolve(root, '**/*'), { nodir: true })

    return files
      .filter((p) => !p.startsWith(path.resolve(root, 'DEBIAN')))
      .filter((p) => (p !== path.resolve(root, 'FILES')))
      .map((p) => p.substring(root.length))
  }
}
