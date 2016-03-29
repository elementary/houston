/**
 * appHooks/changelog/pre.js
 * checks .desktop file for name and icon
 *
 * @exports {Class}
 */

import Ini from 'ini'

import AppHook from '~/flightcheck/appHook'

class Desktop extends AppHook {
  constructor (data) {
    super(data, {
      name: 'desktop',
      post: true
    })
  }

  async test () {
    const desktop = await this.file(`data/${this.data.project.name}.desktop`)

    if (desktop == null) {
      this.error('exist')
      return
    }

    let data = {}
    try {
      data = Ini.parse((new Buffer(desktop, 'base64')).toString())
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

export default Desktop
