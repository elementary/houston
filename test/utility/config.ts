/**
 * houston/test/utility/config.ts
 * Sets up a configuration file used during tests
 *
 * @exports {Function} setup - Creates a new Config for testing
 */

import * as path from 'path'

import { Config } from '../../src/lib/config'
import { getFileConfig } from '../../src/lib/config/loader'

/**
 * setup
 * Creates a new Config for use in tests
 *
 * @async
 * @return {Config}
 */
export async function setup (): Promise<Config> {
  const configPath = path.resolve(__dirname, '../fixture/config.js')
  return getFileConfig(configPath)
}
