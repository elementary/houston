/**
 * houston/src/worker/task/appstream/content-rating.ts
 * Tests the OARS content rating in appstream files
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'

import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamContentRating extends Task {

  /**
   * Path the appstream file should exist at
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/metainfo', `${this.worker.context.nameDomain}.appdata.xml`)
  }

  /**
   * All of the OARS content attributes to check for
   *
   * @var {string[]}
   */
  public attributes = [
    'violence-cartoon',
    'violence-fantasy',
    'violence-realistic',
    'violence-bloodshed',
    'violence-sexual',
    'violence-desecration',
    'violence-slavery',
    'violence-worship',
    'drugs-alcohol',
    'drugs-narcotics',
    'drugs-tobacco',
    'sex-nudity',
    'sex-themes',
    'sex-homosexuality',
    'sex-prostitution',
    'sex-adultery',
    'sex-appearance',
    'language-profanity',
    'language-humor',
    'language-discrimination',
    'social-chat',
    'social-info',
    'social-audio',
    'social-location',
    'social-contacts',
    'money-purchasing',
    'money-gambling'
  ]

  /**
   * Runs all the appstream tests
   *
   * @async
   * @return {void}
   */
  public async run () {
    const raw = await fs.readFile(this.path)
    const $ = cheerio.load(raw, { xmlMode: true })

    const contentRating = $('component > content_rating')

    if (contentRating.length === 0) {
      const template = path.resolve(__dirname, 'content-rating-required.md')

      throw Log.template(Log.Level.ERROR, template, {
        storage: this.worker.context
      })
    }

    if (contentRating.attr('type') == null) {
      const template = path.resolve(__dirname, 'content-rating-type.md')

      throw Log.template(Log.Level.WARN, template, {
        storage: this.worker.context
      })
    }

    const missingAttributes = this.attributes
      .filter((attribute) => !this.hasAttribute($, attribute))

    if (missingAttributes.length > 0) {
      const template = path.resolve(__dirname, 'content-rating-missing.md')

      throw Log.template(Log.Level.ERROR, template, {
        attributes: missingAttributes,
        storage: this.worker.context
      })
    }
  }

  /**
   * Checks if the given document has an OARS attribute
   *
   * @param {Object} $
   * @param {string} attribute
   * @return {Boolean}
   */
  protected hasAttribute ($, attribute) {
    const attr = $(`component > content_rating > content_attribute#${attribute}`)

    return (attr.length !== 0)
  }
}
