/**
 * houston/controller/hook/github.js
 * Handles all GitHub inputs
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'
import crypto from 'crypto'

import config from '~/lib/config'
import log from '~/lib/log'
import Project from '~/houston/model/project'
import Mistake from '~/lib/mistake'

const route = new Router({
  prefix: '/github'
})

/**
 * ANY /hook/github*
 * Checks config for GitHub hook enabled
 */
route.all('*', async (ctx, next) => {
  if (!config.github.hook) {
    log.debug('GitHub hook received but hooks disabled. Returning 503')
    ctx.status = 503
    ctx.body = 'Service Unavailable'
    return
  }

  await next()
})

/**
 * POST /hook/github*
 * Checks header signature for trust issues
 */
route.post('*', async (ctx, next) => {
  if (ctx.request.header['x-hub-signature'] == null) {
    ctx.status = 400
    ctx.body = 'Missing signature header'
    return
  } else if (ctx.request.body.repository == null || ctx.request.body.repository.id == null) {
    ctx.status = 400
    ctx.body = 'Malformed request'
    return
  }

  return Project.findOne({
    'github.id': ctx.request.body.repository.id
  })
  .then((project) => {
    if (project == null) throw new Mistake(404, 'No project found')

    const hash = crypto
    .createHmac('sha1', project.github.secret)
    .update(ctx.request.rawBody)
    .digest('hex')

    const signature = `sha1=${hash}`

    if (ctx.request.header['x-hub-signature'] !== signature) {
      ctx.status = 403
      ctx.body = 'GitHub signature checking failed'
      return
    }

    return next()
  })
  .catch((error) => {
    if (error.mistake) {
      log.verbose('GitHub hook was unable to find project')

      ctx.status = 404
      ctx.body = 'Project not found'
      return
    } else {
      log.error('GitHub hook encountered an error trying to find project', error)

      ctx.status = 500
      ctx.body = 'Houston encountered an error while trying to process your request'
      return
    }
  })
})

/**
 * POST /hook/github*
 * Does the processing of GitHub hooks
 */
route.post('*', async (ctx, next) => {
  if (ctx.request.header['x-github-event'] === 'ping') {
    log.debug('GitHub hook ping')
    ctx.status = 200
    ctx.body = 'OK'
    return
  }

  ctx.status = 200
  ctx.body = 'OK'
  return
})

export default route
