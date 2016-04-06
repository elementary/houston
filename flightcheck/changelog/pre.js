/**
 * flightcheck/changelog/pre.js
 * Checks all releases have changelogs
 *
 * @exports {Class} - AppHook class for checking all GitHub releases have a body
 */

import AppHook from '~/flightcheck/appHook'

import { Request } from '~/app'

class Changelog extends AppHook {
  constructor (data) {
    super(data, {
      name: 'changelog',
      post: true
    })
  }

  test () {
    return Request
    .get(`https://api.github.com/repos/${this.data.project.github.fullName}/releases`)
    .auth(this.data.project.github.token)
    .then(res => res.body)
    .then(releases => {
      for (let i in releases) {
        const release = releases[i]
        if (release.body === '') this.error(release.tag_name)
      }
      return Promise.resolve()
    })
  }
}

export default Changelog
