/**
 * lib/log.js
 * Creates a simple, multi environment, namespaced log class
 * NOTE: our global namespace is "houston"
 * @flow
 *
 * @see https://github.com/visionmedia/debug
 *
 * @exports {Log} default - a simple, multi environment log module
 */

import Debug from 'debug'
import raven from 'raven'

import config from './config'

const namespace = 'houston'

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
      Debug.enable(`${namespace}:debug`)
      Debug.enable(`${namespace}:*:debug`)
    case (config.log === 'info'):
      Debug.enable(`${namespace}:info`)
      Debug.enable(`${namespace}:*:info`)
    case (config.log === 'warn'):
      Debug.enable(`${namespace}:warn`)
      Debug.enable(`${namespace}:*:warn`)
    case (config.log === 'error'):
      Debug.enable(`${namespace}:error`)
      Debug.enable(`${namespace}:*:error`)
  }
  /* eslint-enable no-fallthourgh */
}

/**
 * Creates a new Log class
 *
 * @property {Object} upstream - Holds upstream debug library instances
 */
const Log = class {
  upstream: Object

  /**
   * Creates a new log subclass
   *
   * @param {String} name - log namespace
   */
  constructor (name: string) {
    this.upstream = {}

    const prefix = (name == null) ? namespace : `${namespace}:${name}`

    this.upstream.debug = Debug(`${prefix}:debug`)
    this.upstream.info = Debug(`${prefix}:info`)
    this.upstream.warn = Debug(`${prefix}:warn`)
    this.upstream.error = Debug(`${prefix}:error`)
  }

  /**
   * debug
   * Logs a message to debug log
   *
   * @param {...*} args - anything to send to upstream Debug library
   * @returns {Void}
   */
  debug (...args: any) {
    this.upstream.debug(...args)
  }

  /**
   * info
   * Logs a message to info log
   *
   * @param {...*} args - anything to send to upstream Debug library
   * @returns {Void}
   */
  info (...args: any) {
    this.upstream.info(...args)
  }

  /**
   * warn
   * Logs a message to warn log
   *
   * @param {...*} args - anything to send to upstream Debug library
   * @returns {Void}
   */
  warn (...args: any) {
    this.upstream.warn(...args)
  }

  /**
   * error
   * Logs a message to error log
   *
   * @param {...*} args - anything to send to upstream Debug library
   * @returns {Void}
   */
  error (...args: any) {
    this.upstream.error(...args)
  }

  /**
   * report
   * Sends a report to third party error logging service
   *
   * @param {Error} err - an error to capture
   * @param {Object} [data] - any extra data to send along with error
   * @returns {Void}
   */
  report (err: Error, data: ?Object) {
    if (sentry != null) {
      sentry.captureException(err, data)
    } else {
      this.info('Reporter disabled. Not sending error')
    }
  }
}

/**
 * From this point on, all Log class functions should be complete. It's time to
 * setup global log functions, listeners, and third party services.
 */

const log = new Log('lib:log')

process.on('unhandledRejection', (reason, promise) => {
  log.warn(`Unhandled rejection at ${promise._fulfillmentHandler0}\n`, reason)
  log.report(reason)
})

export { sentry }
export default Log
