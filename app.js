/**
 * app.js
 * Consolidates all of Houston to a single file
 *
 * @exports {Object} Helpers
 * @exports {Object} Config
 * @exports {Objcet} Pkg
 * @exports {Object} Log
 * @exports {Object} Db
 */

import Fs from 'fs'
import Mongoose from 'mongoose'
import Winston from 'winston'

let app = {}

// Convenience export of helpers
export const Helpers = require('./helpers')

// Application configuration loading from config.js
try {
  Fs.statSync('./config.js')
} catch (err) {
  console.log('It seems like you have not taken the time to setup Houston yet.')
  console.log('Please use the example configuration file we have provided you')
  console.log('to setup Houston.')
  throw new Error('failed to setup Houston')
}

app.config = require('./config.js')

if (process.env.NODE_ENV != null) app.config.env = process.env.NODE_ENV
if (process.env.PORT != null) app.config.server.port = process.env.PORT

export const Config = app.config

// Application package configuration
export const Pkg = require('./package.json')

// Winston application logging
app.config.log.transports = []

if (app.config.log.console) {
  app.config.log.transports.push(
    new Winston.transports.Console({
      prettyPrint: true,
      colorize: true,
      level: app.config.log.level
    })
  )
}

if (app.config.log.files) {
  app.config.log.transports.push(
    new Winston.transports.File({
      name: 'info-file',
      filename: 'info.log',
      level: 'info'
    })
  )
  app.config.log.transports.push(
    new Winston.transports.File({
      name: 'error-file',
      filename: 'error.log',
      level: 'error'
    })
  )
}

app.log = new Winston.Logger({
  transports: app.config.log.transports
})

app.log.exitOnError = (app.config.env === 'development')

export const Log = app.log

// Start mongoose database connection
app.db = Mongoose.connect(app.config.database)

app.db.connection.on('error', function (msg) {
  throw new Error(msg)
})

app.db.connection.once('open', function () {
  app.log.info('Connected to database')
})

export const Db = app.db
