/**
 * houston/passport/index.js
 * Sets up Passport authentication
 *
 * @exports {Function} setup - sets up passport with server
 * @exports {Object} - Koa router objects
 */

import passport from 'koa-passport'
import Router from 'koa-router'

import * as github from './github'
import log from '~/lib/log'

/**
 * setup
 * Sets up passport with server
 *
 * @param {Object} server - server to attach passport to
 */
export function setup (server) {
  // TODO: actually serialize users
  passport.serializeUser((user, done) => {
    done(null, user)
  })

  passport.deserializeUser((user, done) => {
    done(null, user)
  })

  passport.use(github.strategy)

  server.use(passport.initialize())
  server.use(passport.session())

  server.use(async (ctx, next) => {
    ctx.state.user = (ctx.passport.user != null) ? ctx.passport.user : null
    ctx.user = (ctx.passport.user != null) ? ctx.passport.user : null
    await next()
  })

  log.silly('Passport setup complete')
}

export const router = new Router({
  prefix: '/auth'
})

router.get('/logout', (ctx) => {
  ctx.logout()
  ctx.redirect('/')
})

router.use(github.router.routes(), github.router.allowedMethods())
