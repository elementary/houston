/**
 * core/passport/index.js
 * Sets up Passport authentication
 */

import Passport from 'koa-passport'
import Router from 'koa-router'

import { Log } from '~/app'

import * as Github from './github'

// Passport setup
export function Setup (Server) {
  // TODO: actually serialize users
  Passport.serializeUser((user, done) => {
    done(null, user)
  })

  Passport.deserializeUser((user, done) => {
    done(null, user)
  })

  Passport.use(Github.Strategy)

  Server.use(Passport.initialize())
  Server.use(Passport.session())

  Server.use(async (ctx, next) => {
    ctx.state.user = (ctx.passport.user != null) ? ctx.passport.user : null
    ctx.user = (ctx.passport.user != null) ? ctx.passport.user : null
    await next()
  })

  Log.verbose('Passport Initalized')
}

let route = new Router({
  prefix: '/auth'
})

route.get('/logout', ctx => {
  ctx.logout()
  ctx.redirect('/')
})

route.use(Github.Route.routes(), Github.Route.allowedMethods())

export const Route = route
