/**
 * flightcheck/debian/pre.js
 * Checks debian control file for source and package
 *
 * @exports {Class} - Checks debian control file
 */

import AppHook from '~/flightcheck/appHook'

/**
 * paddingRemove
 * Removes padding from string
 * NOTE: this might be a really weird hack type function, but it works well :/
 *
 * @param {String} str - string to remove padding from
 */
function paddingRemove (str) {
  return `  ${str}  `.replace(/\s{2,}/g, '')
}

/**
 * parseControl
 * Parses the debian control file
 *
 * @param {String} str - string to parse
 * @returns {Object} - javascript object of debian control file
 */
function parseControl (str) {
  const data = {
    'Build-Depends': []
  }

  const l = str.split('\n')
  let header = null

  for (let i = 0; i < l.length; i++) {
    const s = l[i].split(/:\s*/)

    if (s[1]) {
      header = s[0]
    }

    if (header === 'Build-Depends') {
      const d = paddingRemove(((s[1] == null) ? s[0] : s[1]).replace(',', ''))

      if (d !== '') {
        data['Build-Depends'].push(d)
      }
    } else {
      const d = paddingRemove(l[i].substr(l[i].indexOf(':') + 1))

      if (s[1] == null) {
        data[header] += ` ${d}`
      } else {
        data[header] = d
      }
    }
  }

  return data
}

/**
 * Debian
 * Checks debian control file
 *
 * @param {Object} data - Includes project, cycle, and release (if applicible)
 */
export default class Debian extends AppHook {
  constructor (data) {
    super(data, {
      name: 'debian',
      post: true
    })
  }

  async test () {
    const control = await this.file('debian/control')

    if (control == null) {
      this.error('exist')
      return
    }

    let data = null
    try {
      data = parseControl(control)
    } catch (err) {
      this.meta({ dump: err })
      this.error('parse')
      return
    }

    if (data['Source'] == null || data['Source'] !== this.data.name) {
      this.error('source')
    }

    if (data['Package'] == null || data['Package'] !== this.data.name) {
      this.error('package')
    }

    return
  }
}
