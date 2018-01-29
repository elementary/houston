/**
 * houston/src/worker/task/appstream/release.ts
 * Checks and updates the appstream releases section
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as semver from 'semver'

import markdown from '../../../lib/utility/markdown'
import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamRelease extends Task {

  /**
   * Path the appstream file should exist at
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/metainfo', `${this.worker.storage.nameAppstream}.xml`)
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

    const releases = $('component > releases')

    // NOTE: We want to allow people to fill this in theirself for translations
    if (releases.length === 0) {
      this.fill($)

      await fs.writeFile(this.path, $.xml())
    }
  }

  /**
   * Fills in the missing releases section
   *
   * @param {Object} $ - cheerio appstream document
   * @return {void}
   */
  protected fill ($) {
    if ($('component > releases').length === 0) {
      $('component').append('<releases></releases')
    }

    this.worker.storage.changelog
      .sort((a, b) => semver.rcompare(a.version, b.version))
      .forEach((change) => {
        const release = $('component > releases').prepend('<release></release>')

        release.attr('version', change.version)
        release.attr('date', change.date.toISOString())
        release.attr('urgency', this.urgency(change.changes))
        release.html(this.html(change.changes))
      })
  }

  /**
   * Parses a markdown changelog to find an urgency of the release
   *
   * @param {String} change
   * @return {String} - "low" "medium" "high" or "critical". "medium" is default
   */
  protected urgency (change) {
    const grepable = change.replace(/\W/img, '')

    if (grepable.indexOf('security') || grepable.indexOf('critical')) {
      return 'critical'
    } else {
      return 'medium'
    }
  }

  /**
   * Converts a markdown changelog to something appstream can deal with
   *
   * @param {String} change
   * @return {String}
   */
  protected html (change) {
    const html = markdown(change)
    const $ = cheerio.load(html)

    $(':not(p, ul, li)').forEach(function () {
      $(this).replaceWith(`<p>${$(this).html()}</p>`)
    })

    return $.html()
  }
}
