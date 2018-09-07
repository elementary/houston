/**
 * houston/src/worker/task/appstream/validate.ts
 * Runs appstreamcli to validate appstream file
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { sanitize } from '../../../lib/utility/rdnn'
import { Docker } from '../../docker'
import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamValidate extends Task {
  /**
   * Location of the appstream cli log
   *
   * @return {string}
   */
  protected get logPath () {
    return path.resolve(this.worker.workspace, 'appstream.log')
  }

  /**
   * Returns the main appstream file name
   *
   * @return {string}
   */
  public get name () {
    return sanitize(this.worker.context.nameDomain, '-')
  }

  /**
   * Path to folder containing the appstream file
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/metainfo')
  }

  /**
   * Runs appstream validate with docker
   *
   * @async
   * @return {void}
   */
  public async run () {
    const docker = await this.docker()

    const file = `${this.name}.appdata.xml`
    const cmd = `validate ${file} --no-color`
    const exit = await docker.run(cmd)

    if (exit !== 0) {
      throw await this.log()
    }
  }

  /**
   * Formats the docker log to something we can pass to the user
   *
   * @async
   * @return {Log}
   */
  protected async log () {
    const p = path.resolve(__dirname, 'validate.md')
    const log = await fs.readFile(this.logPath, 'utf8')

    return Log.template(Log.Level.ERROR, p, {
      log,
      storage: this.worker.context
    })
  }

  /**
   * Returns a docker instance to use for liftoff
   *
   * @async
   * @return {Docker}
   */
  protected async docker (): Promise<Docker> {
    const docker = new Docker(this.worker.config, 'appstream-validate')

    const exists = await docker.exists()
    if (exists === false) {
      const folder = path.resolve(__dirname, 'validate')
      await docker.create(folder)
    }

    docker.log = this.logPath

    docker.mount(this.path, '/tmp/houston')

    return docker
  }
}
