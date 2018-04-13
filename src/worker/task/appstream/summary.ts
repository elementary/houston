/**
 * houston/src/worker/task/appstream/summary.ts
 * Checks stuff about the appstream summary field
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'

import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamSummary extends Task {

  /**
   * Path the appstream file should exist at
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/metainfo', `${this.worker.context.nameDomain}.appdata.xml`)
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

    const summary = $('component > summary')

    if (summary.length === 0) {
      throw new Log(Log.Level.ERROR, 'Missing "summary" field')
    }

    const text = summary.text()

    if (text.toLowerCase().replace(/\W/, '').indexOf('elementaryos') !== -1) {
      throw new Log(Log.Level.ERROR, '"summary" field calls out elementary OS')
    }
  }
}
