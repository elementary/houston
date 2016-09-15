/**
 * lib/config.js
 * Loads config file, checks for new config settings, rewrites based on env
 *
 * @exports {Object} - Houston configuration
 */

import _ from 'lodash'
import fs from 'fs'
import path from 'path'

import * as dotNotation from './helpers/dotNotation'
import houstonPkg from '../../package.json'

let config = {}
let example = {}

// Application configuration loading from config.js if not automated test
try {
  config = require(path.resolve(__dirname, '../../config.js'))
} catch (err) {
  if (process.env.NODE_ENV !== 'test') {
    /* eslint-disable no-console */
    console.error('It seems like you have not taken the time to setup Houston yet.')
    console.error('Please use the example configuration file we have provided you')
    console.error('at "config.example.js" to setup Houston. When you are done place')
    console.error('at "config.js".')
    /* eslint-enable no-console */
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
const envConfig = {}

Object.keys(process.env).forEach((key) => {
  if (key.toLowerCase().substring(0, 7) !== 'houston') return

  envConfig[key.toLowerCase().substring(8, key.length)] = process.env[key]
})

const expanedEnvConfig = dotNotation.toObj(envConfig, '_')

config = _.merge(config, expanedEnvConfig)

// Dynamicly set variables
if (config.env == null) {
  config.env = 'production'
}

if (config.server.port == null) {
  config.server.port = config.server.url.split(':')[2] || 80
}

let commit = '.gitless'
try {
  // eslint-disable-next-line no-sync
  commit = fs.readFileSync(path.resolve(__dirname, '../../.git/ORIG_HEAD'), {
    encoding: 'utf8'
  })
  .split('\n')[0]
} catch (error) {}

config = _.merge(config, {
  houston: {
    root: path.resolve(__dirname, '../'),
    version: houstonPkg.version,
    commit
  }
})

// Try to check for unassigned configuration included in the example
try {
  example = require(path.resolve(__dirname, '../../config.example.js'))
} catch (error) {}

const dotConfig = dotNotation.toDot(config)
const dotExample = dotNotation.toDot(example)
const missingConfig = []

// If any higher level attribute is set to false, don't consider it missing
Object.keys(dotExample).forEach((key) => {
  if (dotConfig[key] != null) return

  const splitKey = key.split('.')

  for (let keyI = 1; keyI < splitKey.length; keyI++) {
    const miniKey = splitKey.slice(0, keyI).join('.')

    if (dotConfig[miniKey] == null || dotConfig[miniKey] !== false) {
      missingConfig.push(key)
    }
  }
})

missingConfig.forEach((key) => {
  if (config.env === 'test') return

  // eslint-disable-next-line no-console
  console.error(`Missing ${key} in "config.js"`)
})

if (missingConfig.length > 0) {
  throw new Error('Missing configuration in "config.js"')
}

export default config
