/**
 * master.js
 * Starts Houston's Web Interface
 *
 * @exports {Object} Server
 */

import Koa from 'koa'
import Convert from 'koa-convert'
import Static from 'koa-static-cache'
import View from 'koa-views'
import Co from 'co'
import Path from 'path'
import Parser from 'koa-bodyparser'
import Session from 'koa-session'

import { Config, Helpers, Log } from './app'
import { Controller, Passport } from './core'

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

// Static 'public' folder serving
Server.use(Convert(Static('public')))

// Setup server rendering
Server.use(Convert(View('views', {
  extension: 'jade',
  cache: (Server.env === 'production')
})))

Server.use(async (ctx, next) => {
  ctx.render = Co.wrap(ctx.render)
  ctx.state.basedir = Path.normalize(`${__dirname}/views`)
  ctx.state.title = 'Houston'
  await next()
})

// Start Passport
Server.use(Parser())
Server.keys = [ Config.server.secret ]
Server.use(Convert(Session(Server)))

Passport.Setup(Server)

Server.use(async (ctx, next) => {
  ctx.state.user = (ctx.passport.user != null) ? ctx.passport.user : null
  await next()
})

Server.use(Passport.Route.routes(), Passport.Route.allowedMethods())

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

Log.info(`Loaded ${Helpers.ArrayString('Controller', routes)}`)

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
