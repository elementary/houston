/**
 * lib/log.js
 * Starts a winston logging session
 *
 * @exports {EventHandler} - Winston event handler
 */

import winston from 'winston'

import config from './config'
import * as langHelper from './helpers/lang'

let transports = []

if (config.log.console) {
  transports.push(
    new winston.transports.Console({
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
      handleExceptions: true,
      name: 'error-file',
      filename: 'error.log',
      level: 'error'
    })
  )
}

let log = new winston.Logger({ transports })

log.exitOnError = (config.env !== 'production')

log.lang = langHelper

export default log
