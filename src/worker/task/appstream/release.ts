/**
 * houston/src/worker/task/appstream/release.ts
 * Checks and updates the appstream releases section
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as sanitizeHtml from 'sanitize-html'
import * as semver from 'semver'

import markdown from '../../../lib/utility/markdown'
import { sanitize } from '../../../lib/utility/rdnn'
import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamRelease extends Task {
  /**
   * A list of valid tags for an appstream release
   *
   * @var {String[]}
   */
  protected static WHITELISTED_TAGS = [
    'p', 'ul', 'li'
  ]

  /**
   * The options needed for cheerio parsing
   *
   * @var {object}
   */
  protected static CHEERIO_OPTS = {
    useHtmlParser2: true,
    xmlMode: true
  }

  /**
   * Returns the main appstream file name
   *
   * @return {string}
   */
  public get name () {
    return sanitize(this.worker.context.nameDomain, '_')
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
    const $ = cheerio.load(raw, AppstreamRelease.CHEERIO_OPTS)

    const releases = $('component > releases')

    // NOTE: We want to allow people to fill this in theirself for translations
    if (releases.length === 0) {
      await fs.writeFile(this.path, this.fill($))
    }
  }

  /**
   * Fills in the missing releases section
   *
   * @param {Object} $ - cheerio appstream document
   * @return {string} - The full appstream document after filling releases
   */
  protected fill ($) {
    if ($('component > releases').length === 0) {
      $('component').append('<releases></releases>')
    }

    this.worker.context.changelog
      .sort((a, b) => semver.rcompare(a.version, b.version))
      .forEach((change) => {
        $('component > releases').prepend('<release></release>')
        const release = $('component > releases > release:last-of-type')

        release.attr('version', change.version)
        release.attr('date', change.date.toISOString())
        release.attr('urgency', this.urgency(change.changes))
        release.html(`<description>${this.html(change.changes)}</description>`)
      })

    return $.xml()
  }

  /**
   * Parses a markdown changelog to find an urgency of the release
   *
   * @param {String} change
   * @return {String} - "low" "medium" "high" or "critical". "medium" is default
   */
  protected urgency (change) {
    const grepable = change
      .toLowerCase()
      .replace(/\W\s/img, '')
      .replace(/\s+/img, ' ')

    const CRITICAL_WORDS = [
      'security', 'critical'
    ]

    CRITICAL_WORDS.forEach((word) => {
      if (grepable.indexOf(word) !== -1) {
        return 'critical'
      }
    })

    return 'medium'
  }

  /**
   * Converts a markdown changelog to something appstream can deal with
   *
   * @param {String} change
   * @return {String}
   */
  protected html (change) {
    const html = markdown(change)
    const $ = cheerio.load(html, AppstreamRelease.CHEERIO_OPTS)

    const lists = $('ul')
    const paragraphs = $('p')

    if (lists.length === 0 && paragraphs.length === 1) {
      const items = paragraphs.text().split('\n').join('</li><li>')
      $.root().html(`<ul><li>${items}</li></ul>`)
    }

    return this.sanitize($.xml())
  }

  /**
   * Sanitizes the html input to only allowed valid appstream tags
   *
   * @param {String} change
   * @return {String}
   */
  protected sanitize (change) {
    const $el = cheerio.load(change, AppstreamRelease.CHEERIO_OPTS)

    const sanitized = sanitizeHtml($el.xml(), {
      allowedTags: AppstreamRelease.WHITELISTED_TAGS,
      parser: AppstreamRelease.CHEERIO_OPTS
    })

    return cheerio.load(sanitized, AppstreamRelease.CHEERIO_OPTS).xml()
  }
}
