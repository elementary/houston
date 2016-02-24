/**
 * appHooks/apphub/pre.js
 * checks for a valid apphub file
 *
 * @exports {Class}
 */

import AppHook from '~/appHooks/appHook'

class AppHub extends AppHook {
  constructor (data) {
    super(data, {
      name: 'changelog',
      post: true
    })
  }

  async test () {
    const apphub = await this.file('.apphub')

    if (apphub == null) return

    let data = {}
    try {
      data = JSON.parse((new Buffer(apphub, 'base64')).toString())
    } catch (error) {
      this.meta({ dump: error })
      this.error('parse')
      return
    }

    if (typeof data.priceUSD !== 'undefined' && typeof data.priceUSD !== 'number') {
      this.warn('price')
    } else if (data.priceUSD != null) {
      this.update({application: {package: {price: data.priceUSD}}})
    }

    if (typeof data.issueLabel !== 'undefined' && typeof data.issueLabel !== 'number') {
      this.warn('label')
    } else if (data.issueLabel != null) {
      this.update({application: {'github.label': data.issueLabel}})
    }

    return
  }
}

export default AppHub
