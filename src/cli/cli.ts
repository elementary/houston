/**
 * houston/src/cli/cli.ts
 * Some utilities for command line stuff
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { Config } from '../lib/config/class'
import { getConfig as getConfigClass } from '../lib/config/loader'

/**
 * getConfig
 * Loads configuration files and stuff. Used to keep things dry.
 *
 * @param {object} argv - Command line arguments
 * @return {Config}
 */
export function getConfig (argv): Config {
  if (argv.config != null) {
    try {
      return getConfigClass(argv.config)
    } catch (e) {
      console.error(`Unable to load configuration from ${argv.config}`)
      console.error(e.message)
      process.exit(1)
    }
  }

  try {
    return getConfigClass('./config.js')
  } catch (e) {} // tslint:disable-line no-empty

  try {
    return getConfigClass('/etc/houston/config.js')
  } catch (e) {} // tslint:disable-line no-empty

  console.error(`Unable to load configuration file`)
  process.exit(1)

  return new Config()
}
