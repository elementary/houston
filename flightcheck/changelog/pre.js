/**
 * flightcheck/changelog/pre.js
 * Checks all releases have changelogs
 *
 * @exports {Class} - checks that all GitHub releases have a body
 */

import AppHook from '~/flightcheck/appHook'

import request from '~/lib/request'

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
    return request
    .get(`https://api.github.com/repos/${this.data.project.github.fullName}/releases`)
    .auth(this.data.project.github.token)
    .then((res) => res.body)
    .each((release) => {
      if (release.body === '') this.error(release.tag_name)
    })
  }
}
