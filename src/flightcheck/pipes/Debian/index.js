/**
 * flightcheck/pipes/Debian/index.js
 * Creates a debian/ directory for a project
 *
 * @exports {Class} - Creates the debian folder
 */

import path from 'path'

import Pipe from 'flightcheck/pipes/pipe'

/**
 * Debian
 * Creates the debian folder
 */
export default class Debian extends Pipe {

 /**
  * code
  * Creates the debian folder
  *
  * @param {String} p - folder to create debian folder in
  * @param {String} d - distribution to build
  * @returns {Array} - the collective data of every debian file pipe
  */
  async code (p = 'repository', d = 'xenial') {
    const debianFolder = path.join(p, 'debian')

    return Promise.all([
      this.require('DebianChangelog', debianFolder, d),
      this.require('DebianControl', debianFolder)
    ])
  }
}
