/**
 * core/passport/github.js
 * Setup Github Passport object
 *
 * @exports {Function} Server - Sets up Koa server with Github Passport
 * @exports {Object} Route - Koa router object for authentication
 */

import Passport from 'koa-passport'
import Github from 'passport-github'
import Router from 'koa-router'

import { Config } from '~/app'
import { User } from '~/core/model/user'

export const Strategy = new Github.Strategy({
  clientID: Config.github.client,
  clientSecret: Config.github.secret,
  callbackURL: 'http://localhost:3000/auth/github/callback'
}, (access, refresh, profile, done) => {
  // TODO: move user right checking from model to here
  // TODO: code cleanup here. it's a mess
  // FIXME: user needs to relogin for new permission
  User.findOne({ 'github.id': profile.id })
  .then(user => {
    if (user) {
      User.findByIdAndUpdate(user._id, {
        'github.access': access,
        'github.refresh': refresh,
        'date.visited': new Date()
      })
      .then(user => user.getRights())
      .then(user => done(null, user))
      .catch(done)
    } else {
      User.create({
        username: profile.username,
        email: profile.emails[0].value,
        avatar: profile.avatar_url,
        'github.id': profile.id,
        'github.access': access,
        'github.refresh': refresh,
        'date.visited': new Date()
      })
      .then(user => user.getRights)
      .then(user => done(null, user))
      .catch(done)
    }
  })
})

let route = new Router({
  prefix: '/github'
})

route.get('/', Passport.authenticate('github'))

route.get('/callback', Passport.authenticate('github'), (ctx, next) => {
  let path = ctx.session.originalUrl || '/dashboard'
  ctx.session.originalUrl = null
  return ctx.redirect(path)
})

export const Route = route
