/**
 * houston/src/cli/commands/ci.ts
 * Tests a project with the worker. Used when a code base is local.
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import * as fs from 'fs-extra'
import * as isEqual from 'lodash/isEqual'
import * as path from 'path'
import * as semver from 'semver'

import { Config } from '../../lib/config'
import { levelIndex } from '../../lib/log/level'
import { codeRepositoryFactory, ICodeRepositoryFactory } from '../../lib/service'
import { sanitize } from '../../lib/utility/rdnn'
import { Build } from '../../worker/preset/build'
import { IContext } from '../../worker/type'
import { Worker } from '../../worker/worker'
import { setup } from '../utilities'

export const command = 'ci [directory]'
export const describe = 'Tests a local project with the worker process'

const SLUG = process.env.TRAVIS_REPO_SLUG
const REPO = `https://github.com/${SLUG}`
const BRANCH = process.env.TRAVIS_BRANCH

export const builder = (yargs) => {
  return yargs
    .positional('directory', {
      coerce: (v) => path.resolve(process.cwd(), v),
      default: '.',
      describe: 'The project directory to build',
      type: 'string'
    })
    .option('type', {
      choices: ['app', 'system-app', 'library'],
      default: 'app',
      describe: 'The type of project',
      type: 'string'
    })
    .option('repo', {
      ...(SLUG != null) ? { default: REPO } : {},
      demandOption: true,
      describe: 'Full repository URL',
      type: 'string'
    })
    .option('version', {
      coerce: semver.valid,
      default: '0.0.1',
      describe: 'Semver version to build for',
      type: 'string'
    })
    .option('name-developer', {
      describe: 'Developer\'s name',
      type: 'string'
    })
    .option('name-domain', {
      alias: 'n',
      coerce: sanitize,
      describe: 'Reverse Domain Name Notation',
      type: 'string'
    })
    .option('name-human', {
      describe: 'Human readable name',
      type: 'string'
    })
    .option('references', {
      default: [],
      describe: 'References to pull',
      type: 'array'
    })
}

/**
 * Creates a basic storage object for information about the build
 * TODO: All the things
 *
 * @param {object} argv
 * @param {Repository} repository
 * @return {object}
 */
function buildStorage (argv, repository) {
  const nameDomain = argv['name-domain'] || repository.rdnn
  const nameDeveloper = argv['name-developer'] || 'Rabbitbot'
  const nameHuman = argv['name-human'] || 'Application' // TODO: Better name?

  const obj : IContext = {
    appcenter: {},
    appstream: '',
    architecture: '',
    changelog: [],
    distribution: '',
    logs: [],
    nameDeveloper,
    nameDomain,
    nameHuman,
    references: argv.references,
    type: argv.type,
    version: argv.version
  }

  return obj
}

function logSpacer () {
  console.log('')
  console.log('='.repeat(80))
  console.log('')
}

/**
 * Logs all of the logs to the console
 *
 * @param {Log[]} logs
 * @return {void}
 */
function logLogs (logs) {
  for (const log of logs.sort((a, b) => (b.level - a.level))) {
    logSpacer()
    console.log(log.toString())
  }
}

/**
 * Reports the result of the worker
 *
 * @param {Object} argv
 * @param {Worker} worker
 * @return {void}
 */
function logResult (argv, worker) {
  if (worker.fails) {
    console.error(`Error while running build for ${argv.repo} for ${argv.version}`)
    logLogs(worker.result.logs)
    logSpacer()
  } else {
    console.log(`Built ${argv.repo} for version ${argv.version}`)

    const builds = worker.contexts
      .map(({ architecture, distribution }) => ({ architecture, distribution }))
      .filter(({ architecture }) => (architecture !== ''))
      .filter(({ distribution }) => (distribution !== ''))
      .filter((b, i, a) => (a.findIndex((mb) => isEqual(b, mb)) === i))

    for (const build of builds) {
      console.log(`Built ${build.architecture} ${build.distribution}`)
    }

    logLogs(worker.result.logs)
    logSpacer()
  }
}

export async function handler (argv) {
  console.warn('THIS COMMAND IS NOT FULLY COMPLETE')
  console.warn('IT ONLY WORKS ON GITHUB WITH TRAVIS AT THIS TIME')

  const { app } = setup(argv)

  const repoFactory = app.get<ICodeRepositoryFactory>(codeRepositoryFactory)
  const repository = await repoFactory(argv.repo)
  const context = buildStorage(argv, repository)

  const worker = Build(app, repository, context)

  const projectDir = path.resolve(process.cwd(), argv.directory)

  console.log(`Testing "${projectDir}" project for "${argv.repo}"`)

  // Copy over the current folder to the workspace for CI testing.
  worker.on('task:WorkspaceSetup:fork', async (w) => {
    await fs.copy(projectDir, path.resolve(w.workspace, 'clean'), { overwrite: true })
    await fs.copy(projectDir, path.resolve(w.workspace, 'dirty'), { overwrite: true })

    return w
  })

  // We set a simple interval to output so we don't timeout on travis
  const interval = setInterval(() => process.stdout.write('.'), 10000)

  await worker.setup()
  await worker.run()

  clearInterval(interval)
  console.log('.')

  logResult(argv, worker)

  if (worker.fails) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}
