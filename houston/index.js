/**
 * houston/index.js
 * Starts Houston's Web Interface
 *
 * @exports {Object} app - Koa server object
 * @exports {Object} server - Http instance of koa server with atc listener
 */

import co from 'co'
import convert from 'koa-convert'
import http from 'http'
import Koa from 'koa'
import koaStatic from 'koa-static'
import parser from 'koa-bodyparser'
import path from 'path'
import session from 'koa-session'
import view from 'koa-views'

import * as controllers from './controller'
import * as helpers from '~/lib/helpers'
import atc from '~/lib/atc'
import config from '~/lib/config'
import db from '~/lib/database'
import log from '~/lib/log'
import passport from './passport'

let app = new Koa()

// Setup App configuration
app.name = 'Houston'
app.env = config.env

// Socket installation
const server = http.createServer(app.callback())
atc.init('server', server)

// App logging
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const end = new Date()
  log.verbose(`${ctx.method} ${ctx.url} - ${end - start}ms`)
})

// Error pages
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    ctx.app.emit('error', error, ctx)

    const htmlRespond = (ctx.accepts(['json', 'html']) === 'html')
    ctx.status = error.status

    if (error.expose && htmlRespond) {
      return ctx.render('error', error)
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
app.use(koaStatic(path.join(__dirname, 'public')))

// Setup server rendering
app.use(convert(view(path.join(__dirname, 'views'), {
  extension: 'jade',
  cache: (app.env === 'production')
})))

app.use(async (ctx, next) => {
  ctx.render = co.wrap(ctx.render)

  // ctx.state.basedir = Path.normalize(`${__dirname}/views`)
  ctx.state.config = config
  ctx.state.helper = helpers

  ctx.state.title = 'Houston'
  await next()
})

// Start Passport
app.use(parser())
app.keys = [ config.server.secret ]
app.use(convert(session(app)))

require('./passport').setup(app)

app.use(passport.routes.routes(), passport.routes.allowedMethods())

// Load Houston core files
const routes = helpers.structure.flatten(controllers, (object) => {
  return typeof object['Route'] === 'object'
})

routes.forEach((route) => {
  const router = route.Route
  const path = router.opts.prefix || '/'
  app.use(router.routes(), router.allowedMethods())
  log.debug(`Loaded ${path} Router`)
})

log.info(`Loaded ${log.lang.s('Controller', routes)}`)

// 404 page
app.use(ctx => {
  ctx.status = 404

  if (ctx.accepts(['json', 'html']) === 'html') {
    return ctx.render('error', {
      message: 'It seems you stuck the landing. World not found.'
    })
  } else {
    ctx.body = { errors: [{
      status: 404,
      title: 'Page Not Found',
      detail: 'The page you are looking found can not be found'
    }]}
    return
  }
})

// Error logging
app.on('error', function (error, ctx, next) {
  if (app.env === 'test') return

  if (/4.*/.test(error.status)) {
    log.verbose(`${error.status} ${ctx.url}`)
    log.verbose(error.stack)
  } else {
    log.error(error)
  }
})

// Launching server
server.listen(config.server.port)
log.info(`Houston listening on ${config.server.port} in ${app.env} configuration`)

server.on('close', () => {
  db.disconnect()
  log.info('And now my watch has ended')
})

export default { app, server }
