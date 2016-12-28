/**
 * houston/passport/github.js
 * Setup GitHub passport object
 *
 * @exports {Class} strategy - Passport class for GitHub login
 * @exports {Object} - Koa router object for GitHub authentication
 */

import github from 'passport-github'
import passport from 'koa-passport'
import Router from 'koa-router'

import config from 'lib/config'
import Log from 'lib/log'
import request from 'lib/request'
import User from 'lib/database/user'

const log = new Log('passport:github')

/**
 * getMembership
 * Returns a bool indicitive of membership in GitHub team or organization
 *
 * @param {String} member - organization name or team number
 * @param {Object} user - user's db object to test
 * @return {Boolean} - Indication of active membership to organization or team
 */
const getMembership = function (member, user) {
  let url = `https://api.github.com/orgs/${member}/members/${user.username}`

  if (typeof member === 'number') {
    url = `https://api.github.com/teams/${member}/memberships/${user.username}`
  }

  return request
  .get(url)
  .auth(user.github.access)
  .then((data) => {
    if (data.statusType !== 2) return false
    if (data.status === 204) return true
    return (data.body.state === 'active')
  })
  .catch(() => false)
}

/**
 * getRights
 * Updates user with latest GitHub rights
 *
 * @param {Object} user - user database object
 * @return {Object} - updated user object
 */
const getRights = async function (user) {
  if (config.rights) {
    let right = 'USER'

    const beta = await getMembership(config.rights.beta, user)
    const review = await getMembership(config.rights.review, user)
    const admin = await getMembership(config.rights.admin, user)

    if (admin) {
      right = 'ADMIN'
    } else if (review) {
      right = 'REVIEW'
    } else if (beta) {
      right = 'BETA'
    }

    log.debug(`Giving new right of ${right} to ${user.username}`)

    return User.findByIdAndUpdate(user._id, { right }, { new: true })
  }

  log.warn(`Rights are currently disabled. Giving unrestricted access to ${user.username}`)
  log.warn('Clear database before setting up a production environment!')

  return User.findByIdAndUpdate(user._id, { right: 'ADMIN' }, { new: true })
}

/**
 * upsertUser
 * Takes a GitHub user profile from passport and upserts it to the database
 *
 * @param {String} access - GitHub access code
 * @param {String} refresh - GitHub refresh token
 * @param {Object} profile - passport GitHub profile object
 * @returns {Object} - database saved user object
 */
const upsertUser = async function (access, refresh, profile) {
  let user = await User.findOne({
    'github.id': profile.id
  })

  if (user == null) {
    const mappedUser = {
      username: profile.username,
      'github.id': profile.id,
      'github.access': access,
      'github.refresh': refresh,
      'date.visited': new Date()
    }

    if (profile.emails != null) mappedUser.email = profile.emails[0].value
    if (profile.photos != null) mappedUser.avatar = profile.photos[0].value

    user = await User.create(mappedUser)
  }

  await getRights(user)
  return user
}

/**
 * strategy
 * Passport configuration for GitHub
 */
export const strategy = new github.Strategy({
  clientID: config.github.client,
  clientSecret: config.github.secret,
  callbackURL: `${config.server.url}/auth/github/callback`
}, (access, refresh, profile, done) => {
  upsertUser(access, refresh, profile)
  .then((user) => done(null, user))
  .catch((err) => done(err))
})

// Koa server routes used for authentication
export const router = new Router({
  prefix: '/github'
})

router.get('/', passport.authenticate('github', {
  scope: 'repo read:org'
}))

router.get('/callback', passport.authenticate('github'), (ctx, next) => {
  const path = ctx.session.originalUrl || '/dashboard'
  ctx.session.originalUrl = null

  return ctx.redirect(path)
})
