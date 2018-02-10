/**
 * houston/src/worker/task/appstream/name.ts
 * Checks that a name field exists in the appstream file
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'

import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamName extends Task {

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

    const name = $('component > name')

    if (name.length === 0) {
      this.worker.report(new Log(Log.Level.WARN, 'Missing "name" field'))

      $('component').prepend(`<name>${this.worker.storage.nameHuman}</name>`)

      await fs.writeFile(this.path, $.xml())
    }
  }
}
