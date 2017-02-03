/**
 * houston/index.js
 * Starts Houston's Web Interface
 * @flow
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

import * as error from './error'
import * as helpers from 'lib/helpers'
import * as passport from './passport'
import * as permissionError from 'lib/error/permission'
import * as policy from './policy'
import config from 'lib/config'
import controllers from './controller'
import Log from 'lib/log'

const app = new Koa()
const log = new Log('server')

// Setup App configuration
app.name = 'Houston'
app.env = config.env

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

  ctx.state.basedir = path.normalize(`${__dirname}/views`)
  ctx.state.policy = policy
  ctx.state.config = config
  ctx.state.helper = helpers

  ctx.state.title = 'Developer'
  await next()
})

// Error pages
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.app.emit('error', err, ctx)

    if (err instanceof permissionError.PermissionAgreementError) {
      return ctx.redirect('/agreement')
    }

    if (err instanceof permissionError.PermissionRightError && err.user.right === 'USER') {
      return ctx.redirect('/beta')
    }

    const output = error.toFriendly(err)
    ctx.status = output.status
    return ctx.render('error', { error: output })
  }
})

// Body parsing middleware, because every other package likes to overwrite the
// body object, making raw body hashing impossible. FFS
// @see https://github.com/koajs/bodyparser/blob/master/index.js
app.use(async (ctx, next) => {
  ctx.request.rawBody = await rawBody(ctx.req, {
    length: ctx.req.headers['content-length'],
    limit: '1mb'
  })
  .then((buf) => buf.toString())
  .catch((err) => { throw new Error(500, err.message) })

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
app.on('error', async (err, ctx) => {
  if (app.env === 'test') return

  if (err instanceof permissionError.PermissionError) {
    log.debug(err.toString())
    return
  }

  log.error(err)
  log.report(err)
})

export default app
