/**
 * houston/controller/hook/github.js
 * Handles all GitHub inputs
 * @flow
 *
 * @exports {Object} - Koa router
 */

import crypto from 'crypto'
import Router from 'koa-router'
import semver from 'semver'

import * as github from 'service/github'
import config from 'lib/config'
import Log from 'lib/log'
import Project from 'lib/database/project'

const log = new Log('controller:hook:github')
const route = new Router({
  prefix: '/github'
})

/**
 * createInstallation
 * Adds integration and all current installed repos to database
 *
 * @async
 * @param {number} installation - ID of GitHub integration installation
 * @returns {Project[]} - A list of all Projects in the database
 */
export async function createInstallation (installation: number): Promise<Project> {
  const token = await github.generateToken(installation)
  const repositories = await github.getInstallations(token)

  const promises = repositories.map((repo) => createRepository(repo, installation))

  return Promise.all(promises)
}

/**
 * deleteInstallation
 * Adds integration and all current installed repos to database
 *
 * @async
 * @param {number} installation - ID of GitHub integration installation
 * @returns {Promise[]} - A promise of removed Projects from database
 */
export async function deleteInstallation (installation: number): Promise<> {
  const projects = await Project.find({
    'github.installation': installation
  })

  const promises = projects.map((project) => project.delete())

  return Promise.all(promises)
}

/**
 * createRepository
 * Adds a Project to the database based on GitHub repository
 *
 * @async
 * @param {Object} repo - A Project like object to create
 * @param {number} installation - GitHub installation ID
 * @returns {Project} - The Project in the database
 */
export async function createRepository (repo: Object, installation: number): Promise<Project> {
  const token = await github.generateToken(installation)
  const project = await Project.findByDomain(repo.name.domain)

  if (project != null) {
    log.debug(`Project "${repo.name.domain}" already exists in database`)
    return project
  }

  log.debug(`Creating Project "${repo.name.domain}" in database`)

  repo.github.installation = installation
  repo.releases = await github.getReleases(repo.github.owner, repo.github.repo, token)

  repo.releases = repo.releases
  .filter((release) => (release.version != null))
  .sort((a, b) => semver(a.version, b.version))

  const newProject = new Project(repo)
  await newProject.save()
  return newProject
}

/**
 * deleteRepository
 * Adds a Project to the database based on GitHub repository
 *
 * @async
 * @param {number} repo - GitHub ID for repository
 * @returns {Promise} - The promise of removal
 */
export async function deleteRepository (repo: number): Promise<> {
  const project = await Project.findOne({ 'github.id': repo })

  if (project == null) {
    log.debug(`Project "${repo}" does not exist in database`)
    return null
  }

  log.debug(`Removing Project "${project.name}" from database`)
  return project.remove()
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
  if (isNaN(installationId)) {
    ctx.status = 400
    ctx.body = 'Error parsing installation number'
    return
  }

  if (ctx.request.body.action === 'created') {
    log.debug('Creating installation in database')

    try {
      await createInstallation(installationId)
    } catch (err) {
      log.error('Error while adding installation to database')
      log.error(err)
      log.report(err)

      ctx.status = 500
      ctx.body = 'Internal error while adding installation'
      return
    }

    ctx.status = 200
    ctx.body = 'Added installation'
    return
  }

  if (ctx.request.body.action === 'deleted') {
    log.debug('Removing installation from database')

    try {
      await deleteInstallation(installationId)
    } catch (err) {
      log.error('Error while removing installation from database')
      log.error(err)
      log.report(err)

      ctx.status = 500
      ctx.body = 'Internal error while removing installation'
      return
    }

    ctx.status = 200
    ctx.body = 'Removed installation'
    return
  }

  ctx.status = 404
  ctx.body = 'Unknown action'
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
  if (isNaN(installationId)) {
    ctx.status = 400
    ctx.body = 'Error parsing installation number'
    return
  }

  if (ctx.request.body.action === 'added') {
    if (!Array.isArray(ctx.request.body['repositories_added'])) {
      ctx.status = 400
      ctx.body = 'Error parsing repositories added'
      return
    }

    log.debug('Adding repositories in database')

    try {
      const promises = ctx.request.body['repositories_added'].map((req) => {
        return github.generateToken(installationId)
        .then((token) => {
          const [owner, repo] = req['full_name'].split('/')
          return github.getRepo(owner, repo, token)
        })
        .then((repo) => createRepository(repo, installationId))
      })
      await Promise.all(promises)
    } catch (err) {
      log.error('Error while adding installation to database')
      log.error(err)
      log.report(err)

      ctx.status = 500
      ctx.body = 'Internal error while adding installation'
      return
    }

    ctx.status = 200
    ctx.body = 'Added installation'
    return
  }

  if (ctx.request.body.action === 'removed') {
    if (!Array.isArray(ctx.request.body['repositories_removed'])) {
      ctx.status = 400
      ctx.body = 'Error parsing repositories removed'
      return
    }

    log.debug('Removing repositories in database')

    try {
      const promises = ctx.request.body['repositories_removed'].map((req) => {
        const ID = Number(req.id)
        if (ID == null || isNaN(ID)) {
          throw new Error('Unable to parse repository ID')
        }

        return deleteRepository(ID)
      })
      await Promise.all(promises)
    } catch (err) {
      log.error('Error while adding installation to database')
      log.error(err)
      log.report(err)

      ctx.status = 500
      ctx.body = 'Internal error while adding installation'
      return
    }

    ctx.status = 200
    ctx.body = 'Removed installation'
    return
  }

  ctx.status = 404
  ctx.body = 'Unknown action'
  return
})

/**
 * POST /hook/github
 * Does the processing of GitHub hooks
 */
route.post('/', async (ctx, next) => {
  if (ctx.request.body['action'] !== 'published' || ctx.request.body['release'] == null) return next()

  log.debug('Processing new release')

  const id = Project.sanatize(ctx.request.body.repository.id)
  const project = await Project.findOne({ 'github.id': id })

  if (project == null) {
    log.debug('Unable to process new release for unknown project')

    ctx.status = 404
    ctx.body = 'Repository not found'
    return
  }

  const currentRelease = project.releases.find((release) => {
    return (release.github.id === id)
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
