/**
 * lib/config.js
 * Loads config file, checks for new config settings, rewrites based on env
 *
 * @exports {Object} - Houston configuration
 */

import _ from 'lodash'

import * as dotNotation from './helpers/dotNotation'

let config = {}
let example = {}

// Application configuration loading from config.js if not automated test
try {
  config = require('../config')
} catch (err) {
  if (process.env.NODE_ENV !== 'test') {
    console.log('It seems like you have not taken the time to setup Houston yet.')
    console.log('Please use the example configuration file we have provided you')
    console.log('at "config.example.js" to setup Houston. When you are done place')
    console.log('at "config.js".')
    throw new Error('Failed to find Houston configuration file')
  }
}

// Common node environment variables
if (process.env.NODE_ENV != null) {
  config.env = process.env.NODE_ENV
}

if (process.env.PORT != null) {
  config.server.port = process.env.PORT
}

// Load all houston process environment variables
let envConfig = {}

Object.keys(process.env).forEach((key) => {
  if (key.toLowerCase().substring(0, 7) !== 'houston') return

  envConfig[key.toLowerCase().substring(8, key.length)] = process.env[key]
})

const expanedEnvConfig = dotNotation.toObj(envConfig, '_')

config = _.merge(config, expanedEnvConfig)

// Dynamicly set variables
if (config.env == null) {
  config.env = 'development'
}

if (config.server.port == null) {
  config.server.port = config.server.url.split(':')[2] || 80
}

// Try to check for unassigned configuration included in the example
try {
  example = require('../config.example.js')
} catch (error) {}

const dotConfig = dotNotation.toDot(config)
const dotExample = dotNotation.toDot(example)
let missingConfig = []

Object.keys(dotExample).forEach((key) => {
  if (dotConfig[key] != null) return

  // If any higher level attribute is set to false, don't consider it missing
  let falseAttribute = false
  const splitKey = key.split('.')
  for (let keyI = 0; keyI < splitKey.length; keyI++) {
    const miniKey = splitKey.slice(0, keyI).join('.')

    if (dotConfig[miniKey] != null && !dotConfig[miniKey]) {
      falseAttribute = true
    }
  }
  if (falseAttribute) return

  missingConfig.push(key)
})

missingConfig.forEach((key) => {
  if (config.env === 'test') return

  console.log(`Missing ${key} in "config.js"`)
})

if (missingConfig.length > 0) {
  throw new Error('Missing configuration in "config.js"')
}

export default config
