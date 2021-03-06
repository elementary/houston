/**
 * houston/src/worker/task/desktop/index.ts
 * Runs a bunch of tests around the desktop file
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { sanitize } from '../../../lib/utility/rdnn'
import { Log } from '../../log'
import { WrapperTask } from '../wrapperTask'

import { DesktopExec } from './exec'
import { DesktopIcon } from './icon'
import { DesktopValidate } from './validate'

export class Desktop extends WrapperTask {
  /**
   * All of the fun tests we should run on the desktop file
   *
   * @var {Task[]}
   */
  public get tasks () {
    switch (this.worker.context.type) {
      // System apps are allowed system icons
      case 'system-app':
        return [
          DesktopExec,
          DesktopValidate
        ]

      default:
        return [
          DesktopExec,
          DesktopIcon,
          DesktopValidate
        ]
    }
  }

  /**
   * Returns the desktop file name
   *
   * @return {string}
   */
  public get name () {
    return sanitize(this.worker.context.nameDomain, '-')
  }

  /**
   * Path the desktop file should exist at
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/applications', `${this.name}.desktop`)
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
