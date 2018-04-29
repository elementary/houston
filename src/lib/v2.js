/**
 * houston/src/lib/v2.js
 * This file is responsible for creating a new instance of v2 houston. This way
 * we can slowly upgrade current houston until all the parts are in v2.
 */

import { App, Config, Worker } from '@elementaryos/houston'

import { config } from './config'

/**
 * Creates a houston v2 configuration class based on the current v1 config.
 *
 * @return {Config}
 */
function createConfig () {
  return new Config({
    environment: config.env,

    log: {
      console: config.log,
      service: 'error'
    },

    service: {
      aptly: {
        url: config.aptly.url,
        passphrase: config.aptly.passphrase,

        review: config.aptly.review,
        stable: config.aptly.stable
      },

      github: {
        client: config.github.client,
        secret: config.github.secret,

        installation: config.github.integration.id,
        key: config.github.integration.key,
        hook: config.github.integration.secret
      },

      ...(config.sentry == null) ? {} : {
        secret: config.sentry
      }
    }
  })
}

/**
 * Creates a new v2 houston App container
 *
 * @async
 * @return {App}
 */
export function createApp () {
  return new App(createConfig())
}

/**
 * Creates a new v2 houston Worker class constructor
 *
 * @async
 * @return {Worker}
 */
export async function createWorker () {
  const app = await createApp()

  return app.get(Worker)
}
