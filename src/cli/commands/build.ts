/**
 * houston/src/cli/commands/build.ts
 * Builds a project with the worker
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { Config } from '../../lib/config'
import { levelIndex } from '../../lib/log/level'
import { create as createRepository } from '../../lib/service/repository'
import { Build } from '../../worker/role/build'
import { Storable } from '../../worker/storable'
import { Worker } from '../../worker/worker'
import { setup } from '../utilities'

export const command = 'build <repo> <version>'
export const describe = 'Builds a repository with the worker process'

export const builder = (yargs) => {
    return yargs
      .option('architecture', { describe: 'The architecture to build for', type: 'string', default: 'amd64' })
      .option('distribution', { describe: 'The distribution to build for', type: 'string', default: 'loki' })
      .option('name-appstream', { describe: 'The appstream id to use during build', type: 'string' })
      .option('name-developer', { describe: 'The developer\'s name to place in Appstream data', type: 'string' })
      .option('name-domain', { describe: 'The RDNN name to use during build', type: 'string' })
      .option('name-human', { describe: 'The human readable name to use during build', type: 'string' })
}

/**
 * Creates a basic storage object for information about the build
 *
 * @param {object} argv
 * @return {object}
 */
function buildStorage (argv) {
  const obj : Storable = {
    appcenter: {},
    appstream: {},
    architecture: argv.architecture,
    branches: ['refs/heads/master', 'refs/tags/3.2.6'],
    distribution: argv.distribution,
    logs: [],
    nameAppstream: 'com.github.btkostner.vocal.desktop',
    nameDeveloper: 'Blake Kostner',
    nameDomain: 'com.github.btkostner.vocal',
    nameHuman: 'Vocal',
    packageSystem: 'debian',
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
    const task = (log.work != null) ? log.work.constructor.name : 'Worker'
    console.log(`${task}: ${log.title}`)

    if (log.error) {
      console.log(`  ${log.stack}`)
    } else if (log.body != null) {
      console.log(`  ${log.body}`)
    }
  }
}

export async function handler (argv) {
  const { app } = setup(argv)

  const config = app.get<Config>(Config)
  const repository = createRepository(argv.repo)
  const storage = buildStorage(argv)

  const worker = new Worker(config, repository, storage)

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
