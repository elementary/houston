/**
 * houston/index.js
 * Starts Houston's Web Interface
 *
 * @exports {Object} app - Koa server object
 */

import co from 'co'
import convert from 'koa-convert'
import Koa from 'koa'
import koaStatic from 'koa-static'
import path from 'path'
import qs from 'qs'
import rawBody from 'raw-body'
import session from 'koa-session'
import view from 'koa-views'

import * as download from './service/download.js'
import * as helpers from 'lib/helpers'
import * as passport from './passport'
import * as policy from './policy'
import config from 'lib/config'
import controllers from './controller'
import db from 'lib/database'
import Log from 'lib/log'
import Mistake from 'lib/mistake'

const app = new Koa()
const log = new Log('server')

// Setup App configuration
app.name = 'Houston'
app.env = config.env

// Download Tracking syslog Server
download.startSyslog()

// App logging
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const end = new Date()
  log.debug(`${ctx.method} ${ctx.status} ${ctx.url} => ${end - start}ms`)
})

// Static 'public' folder serving
app.use(koaStatic(path.join(__dirname, 'public')))

// Setup server rendering
app.use(convert(view(path.join(__dirname, 'views'), {
  extension: 'pug',
  cache: (app.env === 'production')
})))

app.use(async (ctx, next) => {
  ctx.render = co.wrap(ctx.render)
  ctx.Mistake = Mistake

  ctx.state.basedir = path.normalize(`${__dirname}/views`)
  ctx.state.policy = policy
  ctx.state.config = config
  ctx.state.helper = helpers

  ctx.state.title = 'Developer'
  await next()
})

// Error pages
// eslint-disable-next-line consistent-return
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    ctx.app.emit('error', error, ctx)

    // Because the only difference between a permission error and a beta error
    // is the wording. I regret nothing about this implementation.
    if (error.status === 403 && error.message.toLowerCase().indexOf('beta') !== 0) {
      return ctx.redirect('/beta')
    }

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

// Body parsing middleware, because every other package likes to overwrite the
// body object, making raw body hashing impossible. FFS
// @see https://github.com/koajs/bodyparser/blob/master/index.js
app.use(async (ctx, next) => {
  ctx.request.rawBody = await rawBody(ctx.req, {
    length: this.req.headers['content-length'],
    limit: '1mb'
  })
  .then((buf) => buf.toString())
  .catch((err) => { throw new Mistake(500, err.message) })

  const jsonTypes = [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report'
  ]

  const formTypes = [
    'application/x-www-form-urlencoded'
  ]

  try {
    if (/\S/.test(ctx.request.rawBody)) {
      if (ctx.request.is(jsonTypes)) {
        ctx.request.body = JSON.parse(ctx.request.rawBody)
      } else if (ctx.request.is(formTypes)) {
        ctx.request.body = qs.parse(ctx.request.rawBody)
      }
    }
  } catch (err) {
    log.error('Unable to parse body request')
    log.error(err)
  }

  if (ctx.request.body == null) ctx.request.body = {}

  return next()
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
app.on('error', async (error, ctx) => {
  if (app.env === 'test') return

  if (/4.*/.test(error.status)) {
    log.debug(`${ctx.method} ${ctx.status} ${ctx.url} |> ${error.message}`)
  } else {
    log.error(error)
    log.report(error)
  }
})

// Launching server
app.listen(config.server.port)
log.info(`Houston listening on ${config.server.port} in ${app.env} configuration`)

app.on('close', () => {
  db.disconnect()
  log.info('And now my watch has ended')
})

export default { app }
