/**
 * houston/src/cli/commands/ci.ts
 * Tests a project with the worker. Used when a code base is local.
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import * as fs from 'fs-extra'
import * as path from 'path'

import { Config } from '../../lib/config'
import { levelIndex } from '../../lib/log/level'
import { create as createRepository } from '../../lib/service/repository'
import { Build } from '../../worker/role/build'
import { Storable } from '../../worker/type'
import { Worker } from '../../worker/worker'
import { setup } from '../utilities'

export const command = 'ci [directory]'
export const describe = 'Tests a local project with the worker process'

const REPO = `https://github.com/${process.env.TRAVIS_REPO_SLUG}`

export const builder = (yargs) => {
    return yargs
      .positional('directory', { describe: 'The project directory to build', type: 'string', default: '.' })
      .option('repo', { describe: 'Full repository URL', type: 'string', default: REPO })
      .option('version', { describe: 'Semver version to build for', type: 'string', default: '0.0.1' })
      .option('architecture', { describe: 'Architecture to build for', type: 'string', default: 'amd64' })
      .option('distribution', { describe: 'Distribution to build for', type: 'string', default: 'loki' })
      .option('name-appstream', { describe: 'AppStream id', type: 'string' })
      .option('name-developer', { describe: 'Developer\'s name', type: 'string' })
      .option('name-domain', { describe: 'Reverse Domain Name Notation', type: 'string' })
      .option('name-human', { describe: 'Human readable name', type: 'string' })
      .option('package-system', { describe: 'Package system', type: 'string', default: 'deb' })
      .option('references', { describe: 'References to pull', type: 'array', default: [] })
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
  const nameAppstream = argv['name-appstream'] || `${nameDomain}.desktop`
  const nameDeveloper = argv['name-developer'] || 'Rabbitbot'
  const nameHuman = argv['name-human'] || 'Application' // TODO: Better name?

  const obj : Storable = {
    appcenter: {},
    appstream: {},
    architecture: argv.architecture,
    changelog: [],
    distribution: argv.distribution,
    logs: [],
    nameAppstream,
    nameDeveloper,
    nameDomain,
    nameHuman,
    packageSystem: argv['package-system'],
    references: argv.references,
    version: argv.version
  }

  return obj
}

/**
 * Logs all of the logs to the console
 *
 * @param {Log[]} logs
 * @return {void}
 */
function logLogs (logs) {
  for (const log of logs.sort((a, b) => (b.level - a.level))) {
    console.log(log.toString())
  }
}

export async function handler (argv) {
  console.warn('THIS COMMAND IS NOT FULLY COMPLETE')
  console.warn('IT ONLY WORKS ON GITHUB WITH TRAVIS AT THIS TIME')

  const { app } = setup(argv)

  const config = app.get<Config>(Config)
  const repository = createRepository(argv.repo)
  const storage = buildStorage(argv, repository)

  const worker = new Worker(config, repository, storage)

  const projectDir = path.resolve(process.cwd(), argv.directory)

  console.log(`Testing "${projectDir}" project for "${argv.repo}"`)

  // We listen for when after the WorkspaceSetup role completes so we can
  // Copy over the current directory.
  worker.on('task:WorkspaceSetup:end', async () => {
    await fs.copy(projectDir, path.resolve(worker.workspace, 'clean'), { overwrite: true })
    await fs.copy(projectDir, path.resolve(worker.workspace, 'dirty'), { overwrite: true })
  })

  await worker.setup()
  await worker.run(Build)

  if (worker.fails()) {
    console.error(`Error while running build for ${argv.repo} for ${argv.version}`)
    logLogs(worker.storage.logs)

    process.exit(1)
  } else {
    console.log(`Built ${argv.repo} for version ${argv.version}`)
    logLogs(worker.storage.logs)

    process.exit(0)
  }
}
