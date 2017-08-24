/**
 * houston/test/utility/app.ts
 * Utility for setting up a new app for testing.
 */

import { App } from '../../src/lib/app'
import { setup as setupConfig } from './config'

/**
 * create
 * Creates a new testable app
 *
 * @return {App}
 */
export async function create (): Promise<App> {
  const config = await setupConfig()

  return new App(config)
}
