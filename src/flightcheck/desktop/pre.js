/**
 * flightcheck/changelog/pre.js
 * Checks .desktop file for name and icon
 *
 * @exports {Class} - checks .desktop file compatibility
 */

import ini from 'ini'

import AppHook from '~/flightcheck/appHook'

/**
 * Desktop
 * checks .desktop file compatibility
 *
 * @param {Object} data - Includes project, cycle, and release (if applicible)
 */
export default class Desktop extends AppHook {
  constructor (data) {
    super(data, {
      name: 'desktop',
      post: true
    })
  }

  async test () {
    const desktop = await this.file(`data/${this.data.name}.desktop`)

    if (desktop == null) {
      this.error('exist')
      return
    }

    let data = {}
    try {
      data = ini.parse(desktop)
    } catch (err) {
      this.meta({ dump: err })
      this.error('parse')
      return
    }

    const entry = data['Desktop Entry']

    if (entry == null) {
      this.error('entry')
      return
    }

    if (typeof entry.Name !== 'undefined' && typeof entry.Name !== 'string') {
      this.error('name')
    } else if (entry.Name != null) {
      this.update({application: {package: {name: entry.Name}}})
    }

    return
  }
}
