/**
 * houston/passport/stripe.js
 * Authenticates users with Stipe
 * NOTE: this is a weird file and does not authenticate FOR a user, but instead
 * authenticates a logic for a project. Therefor it does not use the high level
 * passport package, but instead a basic oauth package. Complexities and some
 * "hacks" may follow
 *
 * @exports {Object} - Koa router object for Stripe authentication
 */

import { OAuth2 } from 'oauth/lib/oauth2'
import moment from 'moment'
import Router from 'koa-router'

import * as policy from 'houston/policy'
import config from 'lib/config'
import Log from 'lib/log'
import Project from 'lib/database/project'

const log = new Log('passport:stripe')

const url = 'https://connect.stripe.com/'
const urlAuth = 'oauth/authorize'
const urlToken = 'oauth/token'
const auth = new OAuth2(config.get('stripe.client'), config.get('stripe.secret'), url, urlAuth, urlToken, null)

// Koa server routes used for authentication
export const router = new Router({
  prefix: '/stripe'
})

// NOTE: here be dragons. Really big mockup like dragons that breath fire.
router.get('/callback', policy.isRole('beta'), async (ctx, next) => {
  if (!config.has('stripe')) {
    log.debug('Stripe callback called while configuration disabled')
    return new ctx.Mistake(503, 'Stripe disabled')
  }

  const cookieProject = ctx.cookies.get('stripe_project')
  const project = await Project.findById(cookieProject)

  if (project == null) {
    log.debug('Stripe oauth callback on a mysterious project')
  }

  if (!policy.ifMember(project, ctx.state.user)) {
    throw new ctx.Mistake(403, 'You do not have access to this project')
  }

  const code = ctx.request.query['code']
  const data = await new Promise((resolve, reject) => {
    auth.getOAuthAccessToken(code, {
      grant_type: 'authorization_code',
      redirect_uri: `${config.get('server.url')}/auth/stripe/callback`
    }, (err, access, refresh, results) => {
      if (err) return reject(err)
      return resolve({
        access,
        refresh,
        results
      })
    })
  })
  .catch((err) => {
    log.error('Error while processing Stripe account')
    log.error(err)
    throw new ctx.Mistake(500, 'Error while processing Stripe account')
  })

  if (data.results['livemode'] !== true) {
    log.warn('Returned a non livemode access token. All payments made will be in development mode.')
    log.warn('Clear database before turning to production!')
  }

  await project.update({
    'stripe.enabled': true,
    'stripe.user': ctx.state.user._id,
    'stripe.id': data.results['stripe_user_id'],
    'stripe.access': data.access,
    'stripe.refresh': data.refresh,
    'stripe.public': data.results['stripe_publishable_key']
  })

  return ctx.redirect('/dashboard')
})

router.get('/enable/:project', policy.isRole('beta'), async (ctx, next) => {
  if (!config.has('stripe')) {
    log.debug('Stripe enable called while configuration disabled')
    return new ctx.Mistake(503, 'Stripe disabled')
  }

  const project = await Project.findOne({
    name: ctx.params.project
  })

  if (project == null) {
    log.debug(`Could not found project ${ctx.params.project} in database`)
    throw new ctx.Mistake(404, 'Project not found')
  }

  if (!policy.ifMember(project, ctx.state.user)) {
    throw new ctx.Mistake(403, 'You do not have access to this project')
  }

  log.debug(`Setting stripe project cookie to ${project.name}`)
  ctx.cookies.set('stripe_project', project._id, {
    expires: moment().add(5, 'minutes').toDate(),
    overwrite: true
  })

  const authUrl = auth.getAuthorizeUrl({
    client_id: config.get('stripe.client'),
    response_type: 'code',
    redirect_uri: `${config.get('server.url')}/auth/stripe/callback`,
    scope: ['read_write'],
    always_prompt: true,

    'stripe_user[email]': ctx.state.user.email,
    'stripe_user[physical_product]': false,
    'stripe_user[product_category]': 'software',
    'stripe_user[url]': `https://github.com/${ctx.state.user.username}`
  })

  return ctx.redirect(authUrl)
})

router.get('/disable/:project', policy.isRole('beta'), async (ctx, next) => {
  if (!config.has('stripe')) {
    log.debug('Stripe disable called while configuration disabled')
    return new ctx.Mistake(503, 'Stripe disabled')
  }

  const project = await Project.findOne({
    name: ctx.params.project
  })

  if (project == null) {
    log.debug(`Could not found project ${ctx.params.project} in database`)
    throw new ctx.Mistake(404, 'Project not found')
  }

  if (!policy.ifMember(project, ctx.state.user)) {
    throw new ctx.Mistake(403, 'You do not have access to this project')
  }

  await project.update({
    'stripe.enabled': false
  })

  return ctx.redirect('/dashboard')
})
