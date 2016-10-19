/**
 * houston/controller/hook/github.js
 * Handles all GitHub inputs
 *
 * @exports {Object} - Koa router
 */

import crypto from 'crypto'
import Router from 'koa-router'
import semver from 'semver'

import * as github from 'service/github'
import config from 'lib/config'
import Log from 'lib/log'
import Project from 'houston/model/project'

const log = new Log('controller:hook:github')
const route = new Router({
  prefix: '/github'
})

/**
 * processInstallations
 * Processes the addition and removal of installations from GitHub hooks
 *
 * @param {Number} installation - GitHub installation number
 * @param {Object[]} [additions] - all installations that have been added
 * @param {Object[]} [removals] - all installations that have been removed
 *
 * @returns {Promise} - a promise of a bunch of work that needs to be done
 */
const processInstallations = async (installation, additions = [], removals = []) => {
  const token = await github.generateToken(installation)
  const promises = []

  log.info(`Adding ${additions.length} repositories`)

  additions.forEach((repo) => {
    const promise = async () => {
      const foundProject = await Project.findOne({ name: repo.name })

      if (foundProject != null) {
        log.info('Trying to add a repository that already exists in database')
        return
      }

      repo.releases = await github.getReleases(repo.github.owner, repo.github.name, token)
      .then((releases) => releases.sort((a, b) => semver(a.version, b.version)))

      if (repo.releases.length > 0) {
        repo._status = 'DEFER'
      } else {
        repo._status = 'NEW'
      }

      return Project.create(repo)
    }

    promises.push(promise())
  })

  // TODO: setup removing projects on GitHub hook event

  return Promise.all(promises)
}

/**
 * ANY /hook/github
 * Checks config for GitHub hook enabled
 */
route.all('/', (ctx, next) => {
  if (config.github.hook) return next()

  log.debug('Received a hook while disabled. Returning 503')

  ctx.status = 503
  ctx.body = 'Service Unavailable'
  return
})

/**
 * ANY /hook/github
 * Checks for accurate webhook secret
 */
route.all('/', async (ctx, next) => {
  if (config.github.integration.secret == null || !config.github.integration.secret) {
    log.warn('Using insecure settings. Please setup integration webhook secret')
    return next()
  }

  if (ctx.request.header['x-hub-signature'] == null) {
    log.warn('Received a webhook without signature')

    ctx.status = 400
    ctx.body = 'Missing signature header'
    return
  }

  const hash = crypto
  .createHmac('sha1', config.github.integration.secret)
  .update(ctx.request.rawBody)
  .digest('hex')

  const signature = `sha1=${hash}`

  if (ctx.request.header['x-hub-signature'] !== signature) {
    log.warn('Received an invalid webhook signature')

    ctx.status = 403
    ctx.body = 'GitHub signature checking failed'
    return
  }

  return next()
})

/**
 * POST /hook/github
 * Processes ping events from GitHub
 */
route.post('/', (ctx, next) => {
  if (ctx.request.header['x-github-event'] !== 'ping') return next()

  log.debug('Pong')

  ctx.status = 200
  ctx.body = 'Pong'
  return
})

/**
 * POST /hook/github
 * Handles the creation of new installations
 */
route.post('/', async (ctx, next) => {
  if (ctx.request.header['x-github-event'] !== 'integration_installation') return next()

  if (typeof ctx.request.body !== 'object') {
    ctx.status = 400
    ctx.body = 'Malformed request'
    return
  }

  if (typeof ctx.request.body.installation !== 'object' || ctx.request.body.installation.id == null) {
    ctx.status = 400
    ctx.body = 'Missing installation ID'
    return
  }

  const installationId = Number(ctx.request.body.installation.id)

  const token = await github.generateToken(installationId)
  const repositories = await github.getInstallations(token)

  try {
    await processInstallations(installationId, repositories)
  } catch (err) {
    log.error('Error while handling installation addition / removal')
    log.error(err)

    ctx.status = 500
    ctx.body = 'Internal error while adding and removing repositories'
    return
  }

  ctx.status = 200
  return
})

/**
 * POST /hook/github
 * Handles adding and removing of installations
 */
route.post('/', async (ctx, next) => {
  if (ctx.request.header['x-github-event'] !== 'integration_installation_repositories') return next()

  if (typeof ctx.request.body !== 'object') {
    ctx.status = 400
    ctx.body = 'Malformed request'
    return
  }

  if (typeof ctx.request.body.installation !== 'object' || ctx.request.body.installation.id == null) {
    ctx.status = 400
    ctx.body = 'Missing installation ID'
    return
  }

  const installationId = Number(ctx.request.body.installation.id)
  const additions = ctx.request.body.repositories_added.map((repo) => github.castProject(repo))
  const removals = ctx.request.body.repositories_removed.map((repo) => github.castProject(repo))

  try {
    await processInstallations(installationId, additions, removals)
  } catch (err) {
    log.error('Error while handling installation addition / removal')
    log.error(err)

    ctx.status = 500
    ctx.body = 'Internal error while adding and removing repositories'
    return
  }

  ctx.status = 200
  return
})

/**
 * POST /hook/github
 * Does the processing of GitHub hooks
 */
route.post('/', async (ctx, next) => {
  if (ctx.request.body['action'] !== 'published' || ctx.request.body['release'] == null) return next()

  log.debug('Processing new release')

  const project = await Project.findOne({
    'github.id': ctx.request.body.repository.id
  })

  if (project == null) {
    log.debug('Unable to process new release for unknown project')

    ctx.status = 404
    ctx.body = 'Repository not found'
    return
  }

  const currentRelease = project.releases.find((release) => {
    return (release.github.id === ctx.request.body.release.id)
  })

  if (currentRelease != null) {
    log.debug('Unable to process new release as it already exists in database')

    ctx.status = 200
    ctx.body = 'Release already exists'
    return
  }

  const release = github.castRelease(ctx.request.body.release)

  await project.update({
    $addToSet: {
      releases: release
    }
  })

  log.debug(`Added ${release.version} to ${project.name}`)

  ctx.status = 200
  ctx.body = 'Release added'
  return
})

export default route
