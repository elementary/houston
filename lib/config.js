/**
 * lib/config.js
 * Loads config file, checks for new config settings, rewrites based on env
 */

import fs from 'fs'
import _ from 'lodash'

import * as dotNotation from './helpers/dotNotation'

let config = {}
let example = {}

// Application configuration loading from config.js if not automated test
if (process.env.NODE_ENV !== 'test') {
  try {
    config = require('../config.js')
  } catch (err) {
    console.log('It seems like you have not taken the time to setup Houston yet.')
    console.log('Please use the example configuration file we have provided you')
    console.log("at 'config.example.js' to setup Houston. When you are done place")
    console.log("at 'config.js'.")
    throw new Error('failed to setup Houston')
  }
}

// Load all process environment variables
let envConfig = {}

console.log(process.env)

Object.keys(process.env).forEach((key) => {
  if (process.env[key].indexOf('HOUSTON') === -1) return

  console.log(process.env)

  envConfig[process.env[key].substr(0, 8)] = process.env[key]
})

const expanedEnvConfig = dotNotation.toObj(envConfig, '_')

config = _.merge(config, expanedEnvConfig)

console.log(config)

// Try to check for unassigned configuration included in the example
try {
  example = require('../config.example.js')
} catch (error) {
  console.log(`Missing 'config.example.js'. Skipping configuration test`)
}

export default config
