/**
 * master.js
 * Starts Houston's Web Interface
 *
 * @exports {Object} Server
 */

require('babel-register')
require('babel-polyfill')

var Koa = require('koa')

var Server = new Koa()
var Config = require('./app').Config
var Log = require('./app').Log
var Helpers = require('./app').Helpers
var Controller = require('./core/controller')

// Setup Server configuration
Server.name = 'Houston'
Server.env = Config.env

// Load Houston core files
var routes = Helpers.FlattenObject(Controller, { Route: 'object' })

for (var key in routes) {
  var router = routes[key].Route
  var path = router.opts.prefix || '/'
  Server.use(router.routes())
  Log.debug(`Loaded ${path} Router`)
}

Log.info(`Loaded ${Helpers.ArrayString('Router', routes)}`)

// Error logging
process.on('unhandledRejection', function (reason, p) {
  if (reason != null) Log.warn(reason)
})

Server.on('error', function (error, ctx) {
  Log.error(error)
})

Server.listen(Config.server.port)
Log.info(`Houston listening on ${Config.server.port}`)

module.exports = Server
