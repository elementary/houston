/**
 * houston/src/worker/task/extract/deb.ts
 * Extracts a deb package so we can test files
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'

import { Docker } from '../../docker'
import { Log } from '../../log'
import { Task } from '../task'

export class ExtractDeb extends Task {
  /**
   * The directory we will extract the deb file to
   *
   * @return {string}
   */
  protected get path () {
    return path.resolve(this.worker.workspace, 'package')
  }

  /**
   * Runs liftoff
   *
   * @async
   * @return {void}
   */
  public async run () {
    await this.setup()

    const docker = await this.docker(this.worker.workspace)

    // The extract script will need to chmod root files
    const exit = await docker.run('extract-deb', { Privileged: true })

    if (exit !== 0) {
      throw new Log(Log.Level.ERROR, 'Unable to unpack Debian package')
    }
  }

  /**
   * Ensures the extract path is created before we run docker
   *
   * @async
   * @return {void}
   */
  protected async setup () {
    await fs.ensureDir(this.path)
  }

  /**
   * Returns a docker instance to use for liftoff
   *
   * @async
   * @param {string} p - Folder to mount for building
   * @return {Docker}
   */
  protected async docker (p: string): Promise<Docker> {
    const docker = new Docker(this.worker.config, 'extract-deb')

    const exists = await docker.exists()
    if (exists === false) {
      const folder = path.resolve(__dirname, 'deb')
      await docker.create(folder)
    }

    docker.mount(this.worker.workspace, '/tmp/houston')

    return docker
  }
}
