/**
 * flightcheck/changelog/pre.js
 * Checks all releases have changelogs
 *
 * @exports {Class} - checks that all GitHub releases have a body
 */

import _ from 'lodash'

import AppHook from '~/flightcheck/appHook'

/**
 * Changelog
 * checks that all GitHub releases have a body
 *
 * @param {Object} data - Includes project, cycle, and release (if applicible)
 */
export default class Changelog extends AppHook {
  constructor (data) {
    super(data, {
      name: 'changelog',
      post: true
    })
  }

  test () {
    return Promise.each(this.data.changelog, (log) => {
      if (_.isEmpty(log.changelog)) {
        this.error(log.version)
      }

      return
    })
  }
}
