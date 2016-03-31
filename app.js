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

import Super from 'superagent-bluebird-promise'

let app = {}

// Convenience export of helpers
export const Helpers = require('./helpers').default

app.config = require('./lib/config').default

export const Config = app.config

// Application package configuration
export const Pkg = require('./package.json')

app.log = require('./lib/log').default

export const Log = app.log

// Start mongoose database connection
export const Db = require('./lib/database').default

// Export an amazing request library
export const Request = Super
