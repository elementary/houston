/**
 * houston/src/worker/task/appstream/index.ts
 * Runs a bunch of appstream tests
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { Log } from '../../log'
import { WrapperTask } from '../wrapperTask'

export class Appstream extends WrapperTask {
  /**
   * All of the fun tests we should run on the appstream file
   *
   * @var {Task[]}
   */
  public tasks = [
    require('./id').AppstreamId,
    require('./name').AppstreamName,
    require('./license').AppstreamLicense,
    require('./summary').AppstreamSummary,
    require('./description').AppstreamDescription,
    require('./release').AppstreamRelease,
    require('./stripe').AppstreamStripe
  ]

  /**
   * Path the appstream file should exist at
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/metainfo', `${this.worker.storage.nameDomain}.appdata.xml`)
  }

  /**
   * Runs all the appstream tests
   *
   * @async
   * @return {void}
   */
  public async run () {
    const exists = await fs.exists(this.path)
    if (exists === false) {
      throw new Log(Log.Level.ERROR, 'Appstream file does not exist')
    }

    await this.runTasks()

    // TODO: Concat all errors that have no body to a single list log
    this.logs.forEach((l) => this.worker.report(l))

    if (this.errorLogs.length > 0) {
      this.worker.stop()
    }

    // Save the appstream information
    this.worker.storage.appstream = await fs.readFile(this.path)
  }
}
