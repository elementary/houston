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

import * as helpers from '~/lib/helpers'
import * as passport from './passport'
import atc from '~/lib/atc'
import config from '~/lib/config'
import controllers from './controller'
import db from '~/lib/database'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'

const app = new Koa()

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
  log.verbose(`${ctx.method} ${ctx.status} ${ctx.url} => ${end - start}ms`)
})

// Error pages
// eslint-disable-next-line consistent-return
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    ctx.app.emit('error', error, ctx)

    const htmlRespond = (ctx.accepts(['json', 'html']) === 'html')

    const pkg = {
      status: error.status
    }

    if (app.env === 'development') {
      pkg.detail = error.stack
    }

    if (error.expose) {
      pkg.title = error.message || 'Houston has encountered an error'
    } else {
      pkg.title = 'Houston has encountered an error'
    }

    ctx.status = pkg.status
    if (htmlRespond) {
      return ctx.render('error', { error: pkg })
    } else {
      ctx.body = { errors: [pkg] }
      return null
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
  ctx.Mistake = Mistake

  ctx.state.basedir = path.normalize(`${__dirname}/views`)
  ctx.state.config = config
  ctx.state.helper = helpers

  ctx.state.title = 'Houston'
  await next()
})

// Start Passport
app.use(parser())
app.keys = [config.server.secret]
app.use(convert(session(app)))

passport.setup(app)

app.use(passport.router.routes(), passport.router.allowedMethods())

// Load Houston core files
app.use(controllers.routes(), controllers.allowedMethods())

// 404 page
app.use((ctx) => {
  ctx.status = 404

  if (ctx.accepts(['json', 'html']) === 'html') {
    return ctx.render('error', { error: {
      status: 404,
      title: 'Page not found',
      detail: ''
    }})
  } else {
    ctx.body = { errors: [{
      status: 404,
      title: 'Page Not Found',
      detail: 'The page you are looking found can not be found'
    }]}
    return null
  }
})

// Error logging
app.on('error', async (error, ctx, next) => {
  if (app.env === 'test') return

  if (/4.*/.test(error.status)) {
    log.verbose(`${ctx.method} ${ctx.status} ${ctx.url} => ${error.message}`)
  } else {
    log.error(error)
  }

  await next()
})

// Launching server
server.listen(config.server.port)
log.info(`Houston listening on ${config.server.port} in ${app.env} configuration`)

server.on('close', () => {
  db.disconnect()
  log.info('And now my watch has ended')
})

export default { app, server }
