/**
 * app.js
 * Consolidates all of Houston's needs into a single file
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
import Promise from 'bluebird'
import Super from 'superagent-bluebird-promise'

let app = {}

// Convenience export of helpers
export const Helpers = require('./helpers')

// Application configuration loading from config.js
try {
  Fs.statSync('./config.js')
} catch (err) {
  console.log('It seems like you have not taken the time to setup Houston yet.')
  console.log('Please use the example configuration file we have provided you')
  console.log("at 'config.example.js' to setup Houston. When you are done place")
  console.log("at 'config.js'.")
  throw new Error('failed to setup Houston')
}

app.config = require('./config.js')

let exampleExists = true
try {
  require('./config.example.js')
} catch (err) {
  exampleExists = false
}

if (exampleExists) {
  const example = require('./config.example.js')

  for (let k in app.config) {
    if (!app.config[k]) continue
    if (!example[k]) continue
    if (Object.keys(app.config[k]).length < Object.keys(example[k]).length) {
      console.log(`You are missing ${k} configuration settings`)
      console.log("Please check 'config.example.js' for new settings")
      throw new Error('Missing configuration')
    }
  }
}

app.config.server.port = app.config.server.url.split(':')[2]

if (process.env.NODE_ENV != null) app.config.env = process.env.NODE_ENV
if (process.env.PORT != null) app.config.server.port = process.env.PORT

if (app.config.env == null) app.config.env = 'development'

export const Config = app.config

// Application package configuration
export const Pkg = require('./package.json')

// Winston application logging
app.config.log.transports = []

if (app.config.log.console) {
  app.config.log.transports.push(
    new Winston.transports.Console({
      humanReadableUnhandledException: true,
      handleExceptions: true,
      prettyPrint: true,
      colorize: true,
      level: app.config.log.level
    })
  )
}

if (app.config.log.files) {
  app.config.log.transports.push(
    new Winston.transports.File({
      handleExceptions: false,
      name: 'info-file',
      filename: 'info.log',
      level: 'info'
    })
  )
  app.config.log.transports.push(
    new Winston.transports.File({
      handleExceptions: true,
      name: 'error-file',
      filename: 'error.log',
      level: 'error'
    })
  )
}

app.log = new Winston.Logger({
  transports: app.config.log.transports
})

app.log.on('error', error => {
  Log.error(error)
})

app.log.exitOnError = (app.config.env === 'development')

export const Log = app.log

// Start mongoose database connection
Mongoose.connect(app.config.database)
Mongoose.Promise = Promise

Mongoose.connection.on('error', (msg) => {
  app.log.error(msg)
})

Mongoose.connection.once('open', () => {
  app.log.info('Connected to database')
})

Mongoose.connection.once('close', () => {
  app.log.info('Disconnected to database')
})

export const Db = Mongoose

// Export an amazing request library
export const Request = Super
