/**
 * appHooks/changelog/pre.js
 * checks all releases have changelogs
 *
 * @exports {Object} run - run appHooks with given data
 */

import AppHook from '~/appHooks/appHook'

class Changelog extends AppHook {
  constructor (data) {
    super(data, {
      name: 'changelog',
      post: true
    })
  }

  test () {
    for (let i in this.data.project.releases) {
      if (this.data.project.releases[i].changelog == null) {
        this.error(this.data.project.releases[i].github.tag)
      }
    }

    return
  }
}

export default Changelog
