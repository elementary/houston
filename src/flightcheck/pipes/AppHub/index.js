/**
 * flightcheck/pipes/AppHub/index.js
 * Checks for a valid apphub file
 *
 * @exports {Pipe} - Checks for a valid apphub file
 */

import path from 'path'

import * as dot from 'lib/helpers/dotNotation'
import Pipe from 'flightcheck/pipes/pipe'

/**
 * AppHub
 * Checks for a valid apphub file
 *
 * @extends Pipe
 */
export default class AppHub extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Pipeline} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    // AppHub file defaults
    this.data = {
      log: {
        enabled: true,
        label: 'AppHub',
        color: '3a416f',
        level: 'warn'
      },
      package: {
        price: 0
      },
      endpoints: {
        github: true,
        elementary: true
      }
    }
  }

  /**
   * code
   * Checks for a valid apphub file
   *
   * @param {String} p - folder holding the apphub file
   * @returns {Void}
   */
  async code (p = 'repository') {
    const apphubPath = path.join(p, '.apphub')
    const file = await this.parsable(apphubPath, 'json')

    if (!await file.exists()) {
      return this.log('info', 'AppHub/existance.md')
    }

    let contents = null
    try {
      contents = await file.parse()
    } catch (e) {
      return this.log('error', 'AppHub/parse.md', e)
    }

    const contentDot = dot.toDot(contents)
    const defaultDot = dot.toDot(this.data)
    const extraKeys = []

    // TODO: check for invalid values
    Object.keys(contentDot).forEach((key) => {
      if (defaultDot[key] != null) {
        defaultDot[key] = contentDot[key]
      } else {
        extraKeys.push(key)
      }
    })

    if (extraKeys.length > 0) {
      await this.log('info', 'AppHub/extra.md', extraKeys)
    }

    this.data = dot.toObj(defaultDot)
  }
}
