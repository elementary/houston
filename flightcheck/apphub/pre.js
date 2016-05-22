/**
 * flightcheck/apphub/pre.js
 * Checks for a valid apphub file
 *
 * @exports {Class} - checks for a valid apphub file
 */

import AppHook from '~/flightcheck/appHook'

/**
 * AppHub
 * checks for a valid apphub file
 *
 * @param {Object} data - Includes project, cycle, and release (if applicible)
 */
export default class AppHub extends AppHook {
  constructor (data) {
    super(data, {
      name: 'apphub',
      post: true
    })
  }

  async test () {
    const apphub = await this.file('.apphub')

    if (apphub == null) {
      this.error('exist')
      return
    }

    let data = {}
    try {
      if (!/\S/.test(apphub)) return
      data = JSON.parse(apphub)
    } catch (error) {
      this.meta({ dump: error })
      this.error('parse')
      return
    }

    if (typeof data.priceUSD !== 'undefined' && typeof data.priceUSD !== 'number') {
      this.warn('price')
    } else if (data.priceUSD != null) {
      this.update({'package.price': data.priceUSD})
    }

    if (typeof data.issueLabel !== 'undefined' && typeof data.issueLabel !== 'string') {
      this.warn('label')
    } else if (data.issueLabel != null) {
      this.update({'github.label': data.issueLabel})
    }

    return
  }
}
