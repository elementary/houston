/**
 * houston/passport/index.js
 * Sets up Passport authentication
 *
 * @exports {Function} setup - sets up passport with server
 * @exports {Object} - Koa router objects
 */

import passport from 'koa-passport'
import Router from 'koa-router'

import User from '~/houston/model/user'
import * as github from './github'
import log from '~/lib/log'

/**
 * setup
 * Sets up passport with server
 *
 * @param {Object} server - server to attach passport to
 * @returns {Void}
 */
export function setup (server) {
  // TODO: Serialize user data in the database?
  passport.serializeUser((user, done) => {
    done(null, user._id)
  })

  passport.deserializeUser((id, done) => {
    User.findById(id)
    .then((user) => done(null, user))
    .catch((error) => done(error))
  })

  passport.use(github.strategy)

  server.use(passport.initialize())
  server.use(passport.session())

  server.use(async (ctx, next) => {
    ctx.state.user = (ctx.passport.user != null) ? ctx.passport.user : null
    ctx.user = (ctx.passport.user != null) ? ctx.passport.user : null
    await next()
  })

  log.debug('Passport setup complete')
}

export const router = new Router({
  prefix: '/auth'
})

router.get('/logout', (ctx) => {
  ctx.logout()
  ctx.redirect('/')
})

router.use(github.router.routes(), github.router.allowedMethods())
