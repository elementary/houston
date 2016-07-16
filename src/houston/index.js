/**
 * houston/index.js
 * Starts Houston's Web Interface
 *
 * @exports {Object} app - Koa server object
 * @exports {Object} server - Running Http server
 */

import co from 'co'
import convert from 'koa-convert'
import http from 'http'
import Koa from 'koa'
import koaStatic from 'koa-static'
import parser from 'raw-body'
import path from 'path'
import session from 'koa-session'
import view from 'koa-views'

import * as helpers from '~/lib/helpers'
import * as passport from './passport'
import atc from './service/atc'
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
atc.connect(server)

// App logging
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const end = new Date()
  log.verbose(`${ctx.method} ${ctx.status} ${ctx.url} => ${end - start}ms`)
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

// Error pages
// eslint-disable-next-line consistent-return
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    ctx.app.emit('error', error, ctx)

    const pkg = {
      status: 500,
      detail: null,
      title: 'Houston has encountered an error'
    }

    if (error.mistake && typeof error.status === 'number') {
      pkg.status = error.status
    }

    if (error.expose || app.env === 'development') {
      pkg.title = error.message || 'Houston has encountered an error'
    }

    if (app.env === 'development') {
      pkg.detail = error.stack
    }

    ctx.status = pkg.status
    return ctx.render('error', { error: pkg })
  }
})

// Body parsing middleware
app.use(async (ctx, next) => {
  ctx.request.rawBody = await parser(ctx.req).then((buf) => buf.toString())

  try {
    ctx.request.body = JSON.parse(ctx.request.rawBody)
  } catch (err) {
    ctx.request.body = ctx.request.rawBody
  }

  await next()
})

// Start Passport
app.keys = [config.server.secret]
app.use(convert(session(app)))

passport.setup(app)

app.use(passport.router.routes(), passport.router.allowedMethods())

// Load Houston core files
app.use(controllers.routes(), controllers.allowedMethods())

// 404 page
app.use((ctx) => {
  ctx.status = 404

  return ctx.render('error', { error: {
    status: 404,
    title: 'Page not found',
    detail: ''
  }})
})

// Error logging
app.on('error', async (error, ctx, next) => {
  if (app.env === 'test') return

  if (/4.*/.test(error.status)) {
    log.verbose(`${ctx.method} ${ctx.status} ${ctx.url} |> ${error.message}`)
  } else {
    log.error(error)
  }

  try {
    await next()
  } catch (err) {
    ctx.status = 500

    // TODO: add server monkey email address for emergency dispatching
    ctx.body = "Houston has failed epically. But don't worry, our server monkey has been dispatched"
    return
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
