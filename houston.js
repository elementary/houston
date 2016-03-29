/**
 * master.js
 * Starts Houston's Web Interface
 *
 * @exports {Object} App - Koa server object
 * @exports {Object} Server - Http instance of koa server with io listener
 */

import Co from 'co'
import Convert from 'koa-convert'
import Http from 'http'
import Koa from 'koa'
import Parser from 'koa-bodyparser'
import Path from 'path'
import Session from 'koa-session'
import Static from 'koa-static'
import View from 'koa-views'

import { Config, Db, Helpers, Log } from './app'
import { Controller, Passport } from './core'
import atc from './lib/atc'

let App = new Koa()

// Setup App configuration
App.name = 'Houston'
App.env = Config.env

// Socket installation
const Server = Http.createServer(App.callback())
atc.init('server', Server)

// App logging
App.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const end = new Date()
  Log.verbose(`${ctx.method} ${ctx.url} - ${end - start}ms`)
})

// Error pages
App.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    ctx.app.emit('error', error, ctx)

    const htmlRespond = (ctx.accepts(['json', 'html']) === 'html')
    ctx.status = error.status

    if (error.expose && htmlRespond) {
      return ctx.render('error', { message: error.message })
    } else if (error.expose) {
      ctx.body = { errors: [{
        status: error.status,
        title: error.title,
        detail: error.message
      }]}
      return
    } else if (htmlRespond) {
      return ctx.render('error', { message: 'Houston, we have a problem' })
    } else {
      ctx.body = { errors: [{
        status: error.status,
        title: 'Internal Server Error',
        detail: 'An internal server error occured while proccessing your request'
      }]}
      return
    }
  }
})

// Static 'public' folder serving
App.use(Static(Path.join(__dirname, '/public')))

// Setup server rendering
App.use(Convert(View('views', {
  extension: 'jade',
  cache: (App.env === 'production')
})))

App.use(async (ctx, next) => {
  ctx.render = Co.wrap(ctx.render)

  ctx.state.basedir = Path.normalize(`${__dirname}/views`)
  ctx.state.Config = Config
  ctx.state.Helpers = Helpers

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
  const router = routes[key].Route
  const path = router.opts.prefix || '/'
  App.use(router.routes(), router.allowedMethods())
  Log.debug(`Loaded ${path} Router`)
}

Log.info(`Loaded ${Helpers.ArrayString('Controller', routes)}`)

// 404 page
App.use(ctx => {
  if (ctx.accepts(['json', 'html']) === 'html') {
    return ctx.render('error', { message: 'It seems you stuck the landing. World not found.' })
  } else {
    ctx.status = 404
    ctx.body = { errors: [{
      status: 404,
      title: 'Page Not Found',
      detail: 'The page you are looking found can not be found'
    }]}
    return
  }
})

// Error logging
App.on('error', function (error, ctx, next) {
  if (App.env === 'test') return

  if (/4.*/.test(error.status)) return Log.verbose(`${error.status} ${ctx.url}`)
  return Log.error(error)
})

// Launching server
Server.listen(Config.server.port)
Log.info(`Houston listening on ${Config.server.port} in ${App.env} configuration`)

Server.on('close', () => {
  Db.disconnect()
  Log.info('And now my watch has ended')
})

export default { App, Server }
