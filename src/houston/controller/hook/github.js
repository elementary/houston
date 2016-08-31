/**
 * houston/controller/hook/github.js
 * Handles all GitHub inputs
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'
import crypto from 'crypto'

import * as github from '~/houston/service/github'
import config from '~/lib/config'
import log from '~/lib/log'
import Project from '~/houston/model/project'

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
    if (project == null) {
      log.verbose('GitHub hook was unable to find project')

      ctx.status = 404
      ctx.body = 'Project not found'
      return
    }

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
    log.error('GitHub hook encountered an error trying to find project', error)

    ctx.status = 500
    ctx.body = 'Houston encountered an error while trying to process your request'
    return
  })
})

/**
 * POST /hook/github
 * Does the processing of GitHub hooks
 */
route.post('*', async (ctx, next) => {
  if (ctx.request.header['x-github-event'] === 'ping') {
    log.debug('GitHub hook: Ping')
    ctx.status = 200
    ctx.body = 'Pong'
    return
  }

  if (ctx.request.body['action'] === 'published' && ctx.request.body['release'] != null) {
    log.debug('GitHub hook: New release')

    const project = await Project.findOne({
      'github.id': ctx.request.body.repository.id
    })
    .exec()

    if (project == null) {
      log.debug('GitHub hook: Repository not found')
      ctx.status = 404
      ctx.body = 'Repository not found'
      return
    }

    const currentRelease = project.releases.find((release) => {
      return (release.github.id === ctx.request.body.release.id)
    })

    if (currentRelease != null) {
      log.debug('GitHub hook: Release already exists')
      ctx.status = 200
      ctx.body = 'Release already exists'
      return
    }

    return project.update({
      $addToSet: {
        releases: github.castRelease(ctx.request.body.release)
      }
    })
    .then(() => {
      log.debug('GitHub hook: Release added')
      ctx.status = 200
      ctx.body = 'Release added'
    })
    .catch((error) => {
      log.warn(error)
      ctx.status = 400
      ctx.body = 'Unable to update database'
    })
  }

  log.debug('GitHub hook: Unknown action')
  ctx.status = 404
  return
})

export default route
