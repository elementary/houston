/**
 * houston/src/lib/v2.js
 * This file is responsible for creating a new instance of v2 houston. This way
 * we can slowly upgrade current houston until all the parts are in v2.
 */

require('reflect-metadata')

import {
  App,
  Aptly,
  codeRepositoryFactory,
  Config,
  Worker
} from '@elementaryos/houston'

import config from './config'

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

    docker: {
      socketPath: config.flightcheck.docker
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

        installation: config.github.app.id,
        key: config.github.app.key,
        hook: config.github.app.secret
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

/**
 * Creates a new v2 houston aptly service
 *
 * @async
 * @return {Aptly}
 */
export async function createAptly () {
  const app = await createApp()

  return app.get(Aptly)
}

/**
 * Creates a new code repository from a given url
 *
 * @async
 * @param {string} url A repository url
 * @return {ICodeRepository}
 */
export async function createCodeRepository (url) {
  const app = await createApp()
  const factory = app.get(codeRepositoryFactory)

  return factory(url)
}
