/**
 * houston/src/worker/task/appstream/license.ts
 * Checks that a project_license is in the appstream file
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'

import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamLicense extends Task {

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
    const raw = await fs.readFile(this.path)
    const $ = cheerio.load(raw, { xmlMode: true })

    const license = $('component > project_license')

    if (license.length === 0) {
      throw new Log(Log.Level.WARN, 'Missing "project_license" field')
    }
  }
}
