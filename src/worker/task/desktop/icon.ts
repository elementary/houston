/**
 * houston/src/worker/task/appstream/icon.ts
 * Checks that a icon field is matches app name in the desktop file
 */

import * as fs from 'fs-extra'
import * as ini from 'ini'
import * as path from 'path'

import { sanitize } from '../../../lib/utility/rdnn'
import { Log } from '../../log'
import { Task } from '../task'

export class DesktopIcon extends Task {
  /**
   * Path the desktop file should exist at
   *
   * @return {string}
   */
  public get path () {
    const name = sanitize(this.worker.context.nameDomain, '-')

    return path.resolve(this.worker.workspace, 'package/usr/share/applications', `${name}.desktop`)
  }

  /**
   * Checks Icon field in desktop file
   *
   * @async
   * @return {void}
   */
  public async run () {
    const raw = await fs.readFile(this.path, 'utf8')
    const data = ini.parse(raw)

    if (data['Desktop Entry'] == null) {
      throw new Log(Log.Level.ERROR, 'Missing application data')
    }

    if (data['Desktop Entry'].Icon !== sanitize(this.worker.context.nameDomain, '-')) {
      throw new Log(Log.Level.ERROR, 'Incorrect desktop file icon value')
    }
  }
}
