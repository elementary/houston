/**
 * houston/src/worker/task/appstream/id.ts
 * Tests the appstream ID matches correctly
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'

import { sanitize } from '../../../lib/utility/rdnn'
import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamId extends Task {

  /**
   * Returns what the appstream ID should be
   *
   * @return {string}
   */
  public get id () {
    return sanitize(this.worker.context.nameDomain, '_')
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
   * Path the appstream file should exist at
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/metainfo', `${this.name}.appdata.xml`)
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

    const id = $('component > id')

    if (id.length === 0) {
      $('component').prepend(`<id>${this.id}</id>`)
      await fs.writeFile(this.path, $.xml())

      throw new Log(Log.Level.WARN, 'Missing "id" field')
    } else if (id.text() !== this.id) {
      id.text(this.id)
      await fs.writeFile(this.path, $.xml())

      throw new Log(Log.Level.WARN, `"id" field should be "${this.id}"`)
    }
  }
}
