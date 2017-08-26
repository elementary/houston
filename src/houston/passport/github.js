/**
 * houston/passport/github.js
 * Setup GitHub passport object
 * @flow
 *
 * @exports {Class} strategy - Passport class for GitHub login
 * @exports {Object} - Koa router object for GitHub authentication
 */

import github from 'passport-github'
import passport from 'koa-passport'
import Router from 'koa-router'

import * as githubService from 'service/github'
import config from 'lib/config'
import Log from 'lib/log'
import User from 'lib/database/user'

const log = new Log('passport:github')

/**
 * getMembership
 * Returns boolean if user is member of github team or organization
 *
 * @param {String|Number} structure - Team ID or organization name
 * @param {User} user - User to check permission for
 *
 * @async
 * @throws {ServiceError} - on error
 * @return {Boolean} - true if user is member
 */
const getMembership = function (structure: string|number, user: Object): Promise<Boolean> {
  if (typeof structure === 'number') {
    return githubService.getTeamPermission(structure, user)
  } else {
    return githubService.getOrgPermission(structure, user)
  }
}

/**
 * getRights
 * Updates user with latest GitHub rights
 *
 * @param {User} user - User to check permission for
 *
 * @async
 * @throws {ServiceError} - on communication error
 * @return {User} - An updated user model
 */
const getRights = async function (user: Object): Promise<Object> {
  if (config.rights) {
    let right = 'USER'

    const [beta, review, admin] = await Promise.all([
      getMembership(config.rights.beta, user),
      getMembership(config.rights.review, user),
      getMembership(config.rights.admin, user)
    ])

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
 *
 * @async
 * @throws {ServiceError} - on GitHub communication error
 * @returns {Object} - database saved user object
 */
const upsertUser = async function (access: string, refresh: string, profile: Object): Promise<Object> {
  const updatePayload = {
    username: profile.username,
    email: null,
    avatar: null,
    'github.id': profile.id,
    'github.access': access,
    'github.refresh': refresh,
    'date.visited': new Date()
  }

  if (profile.emails != null) updatePayload.email = profile.emails[0].value
  if (profile.photos != null) updatePayload.avatar = profile.photos[0].value

  const user = await User.findOneAndUpdate({
    'github.id': profile.id
  }, updatePayload, {
    new: true,
    upsert: true
  })

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
