/**
 * houston/src/cli/process.ts
 * Processes a repository quickly
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { Repository as GithubRepository } from '../lib/service/github/repository'
import { Process } from '../process/process'
import { getConfig } from './cli'

export const command = 'process <user> <repo> <branch>'
export const describe = 'Processes a repository'

export const builder = (yargs) => {
    return yargs
}

export async function handler (argv) {
  const config = getConfig(argv)
  const repository = new GithubRepository(argv.user, argv.repo, argv.branch)
  const proc = new Process(config, repository)

  await proc.setup()
  await proc.teardown()

  process.exit(0)
}
