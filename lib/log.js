/**
 * lib/log.js
 * Starts a winston logging session
 *
 * @exports {EventHandler} - Winston event handler
 */

import winston from 'winston'

import config from './config'
import * as langHelper from './helpers/lang'

const transports = []

if (config.log.console) {
  transports.push(
    new winston.transports.Console({
      handleExceptions: false,
      prettyPrint: true,
      colorize: true,
      level: config.log.level
    })
  )
}

if (config.log.files) {
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

export default log
