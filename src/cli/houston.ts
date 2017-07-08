/**
 * houston/src/cli/houston.ts
 * Entry point to houston CLI
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import * as yargs from 'yargs'

import { getProgramConfig } from '../lib/config/loader'

import * as api from './api'
import * as client from './client'
import * as migrate from './migrate'
import * as repo from './repo'
import * as seed from './seed'
import * as work from './work'

yargs.command(api, api.describe, api.builder)
yargs.command(client, client.describe, client.builder)
yargs.command(migrate, migrate.describe, migrate.builder)
yargs.command(repo, repo.describe, repo.builder)
yargs.command(seed, seed.describe)
yargs.command(work, work.describe, work.builder)

yargs.help('h').alias('h', 'help')
yargs.option('version', { alias: 'v', describe: 'Outputs the current houston version', type: 'boolean' })
yargs.option('config', { alias: 'c', describe: 'Path to configuration file', type: 'string' })

yargs.recommendCommands()
yargs.showHelpOnFail(true)

const argv = yargs.argv

if (argv.version === true) {
  const config = getProgramConfig()

  console.log(config.get('houston.version', 'unknown'))
  process.exit(0)
}
