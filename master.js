/**
 * master.js
 * Starts Houston's Web Interface
 *
 * @exports {Object} Server
 */

import Koa from 'koa'

import { Config, Helpers, Log } from './app'
import { Controller } from './core'

let Server = new Koa()

// Setup Server configuration
Server.name = 'Houston'
Server.env = Config.env

// Server logging
Server.use(async (ctx, next) => {
  let start = new Date()
  await next()
  let end = new Date()
  Log.verbose(`${ctx.method} ${ctx.url} - ${end - start}ms`)
})

// Error pages
Server.use(async (ctx, next) => {
  let error

  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    error = err
  }

  if (error && ctx.status !== 404) {
    ctx.body = 'Crash landed? Lost at sea? Who knows?'
    ctx.app.emit('error', error, ctx)
  } else if (ctx.status === 404) {
    ctx.body = '404 No launchpad here'
  }
})

// Load Houston core files
let routes = Helpers.FlattenObject(Controller, { Route: 'object' })

for (let key in routes) {
  let router = routes[key].Route
  let path = router.opts.prefix || '/'
  Server.use(router.routes(), router.allowedMethods())
  Log.debug(`Loaded ${path} Router`)
}

Log.info(`Loaded ${Helpers.ArrayString('Router', routes)}`)

// Error logging
process.on('unhandledRejection', function (reason, p) {
  if (reason != null) Log.warn(reason)
})

Server.on('error', function (error, ctx, next) {
  if (Server.env === 'test') return

  Log.error(error)
})

// Launching
Server.listen(Config.server.port)
Log.info(`Houston listening on ${Config.server.port}`)

module.exports = Server
