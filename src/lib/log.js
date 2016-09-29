/**
 * lib/log.js
 * Starts a winston logging session
 *
 * @exports {EventHandler} - Winston event handler
 */

import raven from 'raven'
import winston from 'winston'

import config from './config'
import * as langHelper from './helpers/lang'

const transports = []
let sentry = null

if (config.sentry) {
  sentry = new raven.Client(config.sentry, {
    environment: config.env,
    release: config.houston.version,
    tags: { commit: config.houston.comment }
  })

  sentry.patchGlobal()
}

if (config.env !== 'test' && config.log.console) {
  transports.push(
    new winston.transports.Console({
      handleExceptions: false,
      prettyPrint: true,
      colorize: true,
      level: config.log.level,
      timestamp: () => new Date().toLocaleString()
    })
  )
}

if (config.env !== 'test' && config.log.files) {
  transports.push(
    new winston.transports.File({
      handleExceptions: false,
      name: 'info-file',
      filename: 'info.log',
      level: 'info'
    })
  )

  transports.push(
    new winston.transports.File({
      handleExceptions: false,
      name: 'error-file',
      filename: 'error.log',
      level: 'error'
    })
  )
}

const log = new winston.Logger({ transports })

log.exitOnError = false

log.lang = langHelper

process.on('unhandledRejection', (reason, promise) => {
  log.warn(`Unhandled rejection at ${promise._fulfillmentHandler0}\n`, reason)

  if (sentry != null) sentry.captureException(reason)
})

export { sentry }
export default log
