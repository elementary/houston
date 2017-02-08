/**
 * flightcheck/file/package.js
 * A high level class for storage of package information
 * @flow
 *
 * @exports {Class} Package - high level interaction of package files
 */

import File from './index'

/**
 * Package
 * High level interaction of package files
 * TODO: add an extract function to turn packages into a file tree
 *
 * @extends File
 * @property {String} [arch] - Architecture for the package
 * @property {String} [dist] - Distribution for the package
 */
export default class Package extends File {

  arch: string
  dist: string

  /**
   * Creates a file class
   *
   * @param {String} p - Path to the package
   * @param {String} [glob] - Glob search for alternative files
   * @param {String} [arch] - Architecture for the package
   * @param {String} [dist] - Distribution for the package
   * @param {Function} [matchFN] - Function to select correct file from glob search
   */
  constructor (p: string, glob?: string, arch?: string, dist?: string, matchFN?: Function) {
    super(p, glob, matchFN)

    if (arch != null) this.arch = arch.toUpperCase()
    if (dist != null) this.dist = dist.toLowerCase()
  }
}
