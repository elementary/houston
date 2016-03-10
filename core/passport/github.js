/**
 * core/passport/github.js
 * Setup Github Passport object
 *
 * @exports {Class} Strategy - Passport class for GitHub login
 * @exports {Object} Route - Koa router object for GitHub authentication
 */

import Passport from 'koa-passport'
import Github from 'passport-github'
import Router from 'koa-router'

import { Config, Log, Request } from '~/app'
import { User } from '~/core/model/user'

/**
 * getMembership
 * Returns a bool indicitive of membership in GitHub team or organization
 *
 * @param {String} member - organization name or team number
 * @param {Object} user - user's db object to test
 * @return {Boolean} - Indication of active membership to organization or team
 */
const getMembership = function (member, user) {
  let request = ''
  if (typeof member === 'number') {
    request = `https://api.github.com/teams/${member}/memberships/${user.username}`
  } else {
    request = `https://api.github.com/orgs/${member}/members/${user.username}`
  }

  return Request
  .get(request)
  .auth(user.github.access)
  .then(data => {
    if (data.body != null) return (data.body.state === 'active')
    if (data.statusType === 2) return true
    return false
  }, () => false)
  .catch(false)
}

/**
 * getRights
 * Updates user with latest GitHub rights
 *
 * @param {Object} user - user database object
 * @return {Object} - updated user object
 */
const getRights = async function (user) {
  if (Config.rights) {
    let right = 'USER'

    const beta = await getMembership(Config.rights.beta, user)
    const review = await getMembership(Config.rights.review, user)
    const admin = await getMembership(Config.rights.admin, user)

    if (admin) {
      right = 'ADMIN'
    } else if (review) {
      right = 'REVIEW'
    } else if (beta) {
      right = 'BETA'
    }

    Log.verbose(`Giving new right of ${right} to ${user.username}`)

    return User.findByIdAndUpdate(user._id, { right }, { new: true })
  }

  Log.warn(`Rights are currently disabled. Giving unrestricted access to ${user.username}`)
  Log.warn('Clear database before setting up a production environment!')

  return User.findByIdAndUpdate(user._id, { right: 'ADMIN' }, { new: true })
}

// Passport strategy to cover all aspects of GitHub user management
export const Strategy = new Github.Strategy({
  clientID: Config.github.client,
  clientSecret: Config.github.secret,
  callbackURL: `${Config.server.url}/auth/github/callback`
}, (access, refresh, profile, done) => {
  let mappedUser = {
    username: profile.username,
    'github.access': access,
    'github.refresh': refresh,
    'date.visited': new Date()
  }

  if (profile.emails != null) mappedUser.email = profile.emails[0].value
  if (profile.photos != null) mappedUser.avatar = profile.photos[0].value

  User.findOneAndUpdate({
    username: profile.username
  }, mappedUser, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  })
  .then((user) => getRights(user))
  .then((user) => done(null, user))
  .catch((error) => done(error))
})

// Koa server routes used for authentication
let route = new Router({
  prefix: '/github'
})

route.get('/', Passport.authenticate('github', {
  scope: 'repo read:org'
}))

route.get('/callback', Passport.authenticate('github'), (ctx, next) => {
  let path = ctx.session.originalUrl || '/dashboard'
  ctx.session.originalUrl = null
  return ctx.redirect(path)
})

export const Route = route
