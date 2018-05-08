/**
 * houston/src/cli/utilities.ts
 * Some utilities for command line stuff
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { App } from '../lib/app'
import { Config, getConfig } from '../lib/config'
import { Logger } from '../lib/log'

/**
 * Sets up some boilderplate application classes based on command line args
 *
 * @param {Object} argv
 * @return {Object}
 */
export function setup (argv): { app: App, config: Config, logger: Logger } {
  const config = getConfig(argv.config)
  const app = new App(config)
  const logger = app.get(Logger)

  process.on('unhandledRejection', (reason) => console.error(reason))

  return { app, config, logger }
}
