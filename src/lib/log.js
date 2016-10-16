/**
 * lib/log.js
 * Creates a simple, multi environment, namespaced log class
 * NOTE: our global namespace is "app"
 *
 * @see https://github.com/visionmedia/debug
 *
 * @exports {Log} default - a simple, multi environment log module
 */

import Debug from 'debug'
import raven from 'raven'

import config from './config'

const namespace = 'app'

let sentry = null
if (config.sentry) {
  sentry = new raven.Client(config.sentry, {
    environment: config.env,
    release: config.houston.version,
    tags: { commit: config.houston.comment }
  })

  sentry.patchGlobal()
}

// Set the default log level for the app and possibly other libraries
if (process.env.DEBUG == null) {
  /* eslint-disable no-fallthrough */
  switch (true) {
    case (config.log === 'debug'):
      Debug.enable(`${namespace}:*:debug`)
    case (config.log === 'info'):
      Debug.enable(`${namespace}:*:info`)
    case (config.log === 'warn'):
      Debug.enable(`${namespace}:*:warn`)
    case (config.log === 'error'):
      Debug.enable(`${namespace}:*:error`)
  }
  /* eslint-enable no-fallthourgh */
}

/**
 * Creates a new Log class
 */
const Log = class {

  /**
   * Creates a new log subclass
   *
   * @param {String} name - log namespace
   */
  constructor (name = 'global') {
    // This stores all of our upstream Debug instances
    this.upstream = {}

    this.upstream.debug = Debug(`${namespace}:${name}:debug`)
    this.upstream.info = Debug(`${namespace}:${name}:info`)
    this.upstream.warn = Debug(`${namespace}:${name}:warn`)
    this.upstream.error = Debug(`${namespace}:${name}:error`)
  }

  /**
   * debug
   * Logs a message to debug log
   *
   * @param {...*} args - anything to send to upstream Debug library
   * @returns {Void}
   */
  debug (...args) {
    this.upstream.debug(...args)
  }

  /**
   * info
   * Logs a message to info log
   *
   * @param {...*} args - anything to send to upstream Debug library
   * @returns {Void}
   */
  info (...args) {
    this.upstream.info(...args)
  }

  /**
   * warn
   * Logs a message to warn log
   *
   * @param {...*} args - anything to send to upstream Debug library
   * @returns {Void}
   */
  warn (...args) {
    this.upstream.warn(...args)
  }

  /**
   * error
   * Logs a message to error log
   *
   * @param {...*} args - anything to send to upstream Debug library
   * @returns {Void}
   */
  error (...args) {
    this.upstream.error(...args)
  }
}

/**
 * From this point on, all Log class functions should be complete. It's time to
 * setup global log functions, listeners, and third party services.
 */

const log = new Log('lib:log')

process.on('unhandledRejection', (reason, promise) => {
  log.warn(`Unhandled rejection at ${promise._fulfillmentHandler0}\n`, reason)

  if (sentry != null) sentry.captureException(reason)
})

export { sentry }
export default Log
