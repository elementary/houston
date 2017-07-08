/**
 * houston/src/cli/work.ts
 * Processes a repository quickly
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { Repository as GithubRepository } from '../lib/service/github/repository'
import { run as runBuild } from '../worker/role/build'
import { Worker } from '../worker/worker'
import { getConfig } from './cli'

export const command = 'build <user> <repo> <branch>'
export const describe = 'Builds a GitHub repository'

export const builder = (yargs) => {
    return yargs
}

export async function handler (argv) {
  const config = getConfig(argv)
  const repository = new GithubRepository(argv.user, argv.repo, argv.branch)
  const proc = new Worker(config, repository)

  await runBuild(proc)

  process.exit(0)
}
