/**
 * houston/src/worker/task/desktop/index.ts
 * Runs a bunch of tests around the desktop file
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { Log } from '../../log'
import { WrapperTask } from '../wrapperTask'

export class Desktop extends WrapperTask {
  /**
   * All of the fun tests we should run on the desktop file
   *
   * @var {Task[]}
   */
  public tasks = [
    require('./exec').DesktopExec,
    require('./icon').DesktopIcon
  ]

  /**
   * Path the desktop file should exist at
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/applications', this.worker.storage.nameAppstream)
  }

  /**
   * Runs all the desktop tests
   *
   * @async
   * @return {void}
   */
  public async run () {
    const exists = await fs.exists(this.path)
    if (exists === false) {
      throw new Log(Log.Level.ERROR, 'Desktop file does not exist')
    }

    await this.runTasks()

    // TODO: Concat all errors that have no body to a single list log
    this.logs.forEach((l) => this.worker.report(l))

    if (this.errorLogs.length > 0) {
      this.worker.stop()
    }
  }
}
