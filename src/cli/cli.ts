/**
 * houston/src/cli/cli.ts
 * Entry point to houston CLI
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import * as yargs from 'yargs'

import commands from './commands'
import * as version from './commands/version'

for (const c of commands) {
  yargs.command(c)
}

yargs.help('h').alias('h', 'help')
yargs.option('version', { alias: 'v', describe: 'Outputs the current houston version', type: 'boolean' })
yargs.option('config', { alias: 'c', describe: 'Path to configuration file', type: 'string' })

yargs.recommendCommands()
yargs.showHelpOnFail(true)

const argv = yargs.argv

if (argv.version === true) {
  version.handler(argv)
  process.exit(0)
}

if (argv._.length === 0) {
  yargs.showHelp()
  process.exit(1)
}
