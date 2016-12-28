/**
 * flightcheck/file/package.js
 * A high level class for storage of package information
 *
 * @exports {Class} Package - high level interaction of package files
 */

import File from './index'

/**
 * Package
 * High level interaction of package files
 * TODO: add an extract function to turn packages into a file tree
 */
export default class Package extends File {

  /**
   * Creates a file class
   *
   * @param {String} p - Path to the package
   * @param {String} t - Package type based on extension without the dot (deb)
   * @param {String} a - Architecture for the package
   * @param {String} d - Distribution for the package
   */
  constructor (p, t, a, d) {
    super(p)

    if (typeof t !== 'string' || t.length < 2) {
      throw new Error('Package requires an accurate type')
    }

    this.t = t.toLowerCase()
    if (a != null) this.a = a.toUpperCase()
    if (d != null) this.d = d.toLowerCase()
  }
}
