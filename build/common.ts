/**
 * houston/build/common.ts
 * Holds common build values like directories and stuff
 *
 * @exports {object} paths - A list of paths to use when building
 * @exports {string[]} browsers - A list of browsers to support
 */

import * as path from 'path'

/**
 * paths
 * A list of paths to use when building
 *
 * @var {object}
 */
export const paths = {
  dest: path.resolve(__dirname, '..', 'dest'),
  root: path.resolve(__dirname, '..'),
  src: path.resolve(__dirname, '..', 'src')
}

/**
 * browsers
 * A list of all browsers we should support when building client side assets
 *
 * @var {string[]}
 */
export const browsers = ['last 2 version']
