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

// Error pages
Server.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    ctx.app.emit('error', error, ctx)
    if (error.expose) {
      await ctx.render('error', { message: error.message })
    } else {
      await ctx.render('error', { message: 'Houston, we have a problem' })
    }
  }
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
  ctx.state.Config = Config

  ctx.state.title = 'Houston'
  await next()
})

// Start Passport
Server.use(Parser())
Server.keys = [ Config.server.secret ]
Server.use(Convert(Session(Server)))

Passport.Setup(Server)

Server.use(Passport.Route.routes(), Passport.Route.allowedMethods())

// Load Houston core files
let routes = Helpers.FlattenObject(Controller, { Route: 'object' })

for (let key in routes) {
  let router = routes[key].Route
  let path = router.opts.prefix || '/'
  Server.use(router.routes(), router.allowedMethods())
  Log.debug(`Loaded ${path} Router`)
}

Log.info(`Loaded ${Helpers.ArrayString('Controller', routes)}`)

// 404 page
Server.use(async (ctx, next) => {
  await ctx.render('error', { message: 'It seems you stuck the landing. World not found.' })
})

// Error logging
process.on('unhandledRejection', function (reason, p) {
  if (reason != null) Log.warn(`Unhandled Promise Rejection: ${reason}`)
})

Server.on('error', function (error, ctx, next) {
  if (Server.env === 'test') return

  if (/4.*/.test(error.status)) return Log.verbose(`${error.status} ${ctx.url}`)
  return Log.error(error)
})

// Launching
Server.listen(Config.server.port)
Log.info(`Houston listening on ${Config.server.port} in ${Server.env} configuration`)

module.exports = Server
