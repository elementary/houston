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
  Passport.serializeUser((user, done) => {
    done(null, user)
  })

  Passport.deserializeUser((user, done) => {
    done(null, user)
  })

  Passport.use(Github.Strategy)

  Server.use(Passport.initialize())
  Server.use(Passport.session())

  Log.verbose('Github Passport loaded')
  Log.debug('Passport Initalized')
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
