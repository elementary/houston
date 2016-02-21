/**
 * master.js
 * Starts Houston's Web Interface
 *
 * @exports {Object} App
 */

import Co from 'co'
import Convert from 'koa-convert'
import Http from 'http'
import Koa from 'koa'
import Parser from 'koa-bodyparser'
import Path from 'path'
import Session from 'koa-session'
import Static from 'koa-static-cache'
import View from 'koa-views'

import { Config, Helpers, Log } from './app'
import { Controller, Passport } from './core'
import { InitIo } from './core/io'

let App = new Koa()

// Setup App configuration
App.name = 'Houston'
App.env = Config.env

// Socket installation
const Server = Http.createServer(App.callback())
InitIo(Server)

// App logging
App.use(async (ctx, next) => {
  let start = new Date()
  await next()
  let end = new Date()
  Log.verbose(`${ctx.method} ${ctx.url} - ${end - start}ms`)
})

// Error pages
App.use(async (ctx, next) => {
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
App.use(Convert(Static('public')))

// Setup server rendering
App.use(Convert(View('views', {
  extension: 'jade',
  cache: (App.env === 'production')
})))

App.use(async (ctx, next) => {
  ctx.render = Co.wrap(ctx.render)

  ctx.state.basedir = Path.normalize(`${__dirname}/views`)
  ctx.state.Config = Config

  ctx.state.title = 'Houston'
  await next()
})

// Start Passport
App.use(Parser())
App.keys = [ Config.server.secret ]
App.use(Convert(Session(App)))

Passport.Setup(App)

App.use(Passport.Route.routes(), Passport.Route.allowedMethods())

// Load Houston core files
let routes = Helpers.FlattenObject(Controller, { Route: 'object' })

for (let key in routes) {
  let router = routes[key].Route
  let path = router.opts.prefix || '/'
  App.use(router.routes(), router.allowedMethods())
  Log.debug(`Loaded ${path} Router`)
}

Log.info(`Loaded ${Helpers.ArrayString('Controller', routes)}`)

// 404 page
App.use(async (ctx, next) => {
  await ctx.render('error', { message: 'It seems you stuck the landing. World not found.' })
})

// Error logging
process.on('unhandledRejection', function (reason, p) {
  if (reason != null) Log.warn(`Unhandled Promise Rejection: ${reason}`)
})

App.on('error', function (error, ctx, next) {
  if (App.env === 'test') return

  if (/4.*/.test(error.status)) return Log.verbose(`${error.status} ${ctx.url}`)
  return Log.error(error)
})

// Launching server
Server.listen(Config.server.port)
Log.info(`Houston listening on ${Config.server.port} in ${App.env} configuration`)

export default { App }
