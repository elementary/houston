/**
 * houston/src/worker/task/appstream/screenshot.ts
 * Ensures the developer includes a screenshot
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'

import { sanitize } from '../../../lib/utility/rdnn'
import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamScreenshot extends Task {

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

    const screenshots = $('component > screenshots > screenshot')

    if (screenshots.length < 1) {
      throw new Log(Log.Level.ERROR, 'Missing screenshots')
    }

    screenshots.each((i, elem) => this.checkTag($, elem))
  }

  /**
   * Checks a screenshot tag in appstream file
   *
   * @param {Object} elem - Cheerio element
   * @return {void}
   */
  protected checkTag ($, elem) {
    const screenshot = $(elem)
    const image = $('image', screenshot)

    if (image.length < 1) {
      this.worker.report(new Log(Log.Level.ERROR, 'Missing image tag in screenshot'))
    }
  }
}
