/*
 * flightcheck/pipes/GitHub/Release/index.js
 * Post files to GitHub release
 *
 * @exports {Pipe} - Post files to GitHub release
 */

import Pipe from '~/flightcheck/pipes/pipe'

/*
 * GitHubRelease
 * Post files to GitHub release
 *
 * @extends Pipe
 */
export default class GitHubRelease extends Pipe {

  /**
   * code
   * Post files to GitHub release
   */
  async code (files = []) {
    console.log(files)

    // await this.require('GitHubRelease', files)
  }
}
