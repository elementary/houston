/**
 * houston/src/worker/task/appstream/validate.ts
 * Runs desktop files through the `desktop-file-validate` command
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { glob } from '../../../lib/utility/glob'
import { Docker } from '../../docker'
import { Log } from '../../log'
import { Task } from '../task'

export class DesktopValidate extends Task {
  /**
   * Path to folder containing the desktop files
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/applications')
  }

  /**
   * Runs appstream validate with docker
   *
   * @async
   * @return {void}
   */
  public async run () {
    const files = await glob(path.resolve(this.path, '*'))

    const logFiles = []

    for (const file of files) {
      const fileName = path.basename(file)
      const docker = await this.docker(fileName)

      const localFile = path.relative(this.path, file)
      const exit = await docker.run(localFile)

      if (exit !== 0) {
        logFiles.push(fileName)
      }
    }

    if (logFiles.length > 0) {
      throw await this.log(logFiles)
    }
  }

  /**
   * Location of the desktop log file for the given test file
   *
   * @return {string}
   */
  protected logPath (file: string) {
    return path.resolve(this.worker.workspace, `appstream-${file}.log`)
  }

  /**
   * Formats the docker log to something we can pass to the user
   *
   * @async
   * @param {string[]} files
   * @return {Log}
   */
  protected async log (files: string[]) {
    const p = path.resolve(__dirname, 'validate.md')
    const logs = {}

    for (const file of files) {
      logs[file] = await fs.readFile(this.logPath(file), 'utf8')
    }

    return Log.template(Log.Level.ERROR, p, {
      logs,
      storage: this.worker.storage
    })
  }

  /**
   * Returns a docker instance to use for liftoff
   *
   * @async
   * @param {string} file
   * @return {Docker}
   */
  protected async docker (file: string): Promise<Docker> {
    const docker = new Docker(this.worker.config, 'desktop-validate')

    const exists = await docker.exists()
    if (exists === false) {
      const folder = path.resolve(__dirname, 'validate')
      await docker.create(folder)
    }

    docker.log = this.logPath(file)
    docker.mount(this.path, '/tmp/houston')

    return docker
  }
}
