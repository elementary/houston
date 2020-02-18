/**
 * houston/src/flightcheck/index.js
 * Proxies the old flightcheck information to the new houston v2 worker code.
 */

import { ReleaseWorker } from '@elementaryos/houston'
import semver from 'semver'

import * as atc from 'lib/atc'
import Log from 'lib/log'
import { createApp, createCodeRepository } from 'lib/v2'
import * as github from '../service/github'

const log = new Log('flightcheck')

const worker = new atc.Worker('cycle')
const sender = new atc.Sender('cycle')

worker.on('error', (err) => log.error(err))

/**
 * Creates a v2 worker code repository given a GitHub owner, name, and auth
 *
 * @param {String} owner GitHub owner
 * @param {String} name GitHub repository name
 * @param {String} [auth] GitHub auth code
 * @return {ICodeRepository}
 */
async function createRepository (owner, name, auth) {
  if (auth == null) {
    return createCodeRepository(`https://github.com/${owner}/${name}`)
  } else {
    return createCodeRepository(`https://installation:${auth}@github.com/${owner}/${name}`)
  }
}

/**
 * Formats database changelogs to what the v2 worker expects.
 *
 * @param {Object} args The houston worker arguments given
 * @return {Object[]} A bunch of changelogs
 */
function createChanges (args) {
  return args.changelog.map((change) => ({
    author: change.author,
    changes: (change.changelog || []).join('\n'),
    date: change.date,
    version: change.version
  }))
}

/**
 * Sends error information about a failed build.
 *
 * @param {Object} args args
 * @param {Number} args.id The build id
 * @param {Error} args.error The error that occured
 * @return {void}
 */
function handleError ({ id, error }) {
  log.error(error)

  sender.add('error', { id, error })
}

/**
 * Runs a build
 *
 * @async
 * @param {App} app Houston v2 application container
 * @param {GitHub} repo Houston v2 repo service
 * @param {Object} context Houston v2 worker context
 * @param {Object} params All the flightcheck build params
 * @return {void}
 */
async function handleRelease (app, repo, context, { id, project }) {
  log.info(`Starting build for "${context.nameDomain}"`)
  sender.add('start', { id })

  const worker = ReleaseWorker(app, repo, context)

  try {
    await worker.setup()
    await worker.run()
    await worker.teardown()
  } catch (error) {
    return handleError({ id, error })
  }

  const result = worker.result

  if (result.failed) {
    log.info(`Finished failed build for "${context.nameDomain}"`)
  } else {
    log.info(`Finished successful build for "${context.nameDomain}"`)
  }

  result.logs.forEach((l) => {
    log.debug(l)

    if (l.error != null) {
      log.warn(l.error)
    }
  })

  sender.add('finish', {
    id,
    packages: result.packages,
    logs: result.logs
  })
}

(async () => {
  try {
    const app = await createApp()

    worker.register('release', async (args) => {
      try {
        log.debug(`Found build for "${args.id}"`)

        const repo = await createRepository(args.github.owner, args.github.name, args.auth)
        const context = {
          appcenter: {},
          appstream: '',
          architecture: '',
          changelog: createChanges(args),
          distribution: '',
          logs: [],
          nameAppstream: `${repo.rdnn}.desktop`,
          nameDeveloper: args.developer,
          nameDomain: repo.rdnn,
          nameHuman: args.name,
          references: [`refs/tags/${args.tag}`],
          stripe: args.stripe,
          type: 'app',
          version: semver.coerce(args.tag).version
        }

        await handleRelease(app, repo, context, args)
      } catch (error) {
        handleError({ id: args.id, error })
      }
    })

    log.info('Flightcheck started')
    worker.start()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  }
})()
