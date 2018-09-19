/**
 * houston/src/worker/task/appstream/stripe.ts
 * Adds stripe data to appstream file
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'

import { sanitize } from '../../../lib/utility/rdnn'
import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamStripe extends Task {

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
    if (this.worker.context.stripe == null) {
      return
    }

    const raw = await fs.readFile(this.path)
    const $ = cheerio.load(raw, { xmlMode: true })

    if ($('component > custom').length === 0) {
      $('component').append('<custom></custom>')
    }

    $('component > custom').append('<value></value>')

    const $el = $('component > custom > value:last-of-type')

    $el.attr('key', 'x-appcenter-stripe')
    $el.text(this.worker.context.stripe)

    await fs.writeFile(this.path, $.xml())
  }
}
