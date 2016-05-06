/**
 * flightcheck/icon/pre.js
 * Checks for icon sizes
 *
 * @exports {Class} - checks icon sizes
 */

import AppHook from '~/flightcheck/appHook'

/**
 * Icon
 * checks icon sizes
 *
 * @param {Object} data - Includes project, cycle, and release (if applicible)
 */
export default class Icon extends AppHook {
  constructor (data) {
    super(data, {
      name: 'icon',
      post: true
    })
  }

  async test () {
    const icon = await this.file(`icons/64/${this.data.name}.svg`, 'base64')

    if (icon == null) {
      this.error(64)
      return
    }

    this.update({'package.icon': icon})

    return
  }

}
