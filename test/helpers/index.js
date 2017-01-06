/**
 * test/helpers/index.js
 * Useful files for doing common testing things
 *
 * @exports {Function} mockConfig - mocks the global configuration
 */

import path from 'path'

import alias from 'root/.alias'
import config from 'lib/config'

/**
 * mockConfig
 * Mocks the global configuration with the one in fixutres directory
 *
 * @return {Void}
 */
export function mockConfig () {
  config.loadFile(path.resolve(alias.resolve.alias['test'], 'fixtures', 'config.js'))
}
