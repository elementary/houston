/**
 * houston/src/cli/cli.ts
 * Entry point to houston CLI
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import * as yargs from 'yargs'

import commands from './commands'

yargs.version(false)
yargs.help('h').alias('h', 'help')

for (const c of commands) {
  yargs.command(c)
}

yargs.option('config', { alias: 'c', describe: 'Path to configuration file', type: 'string' })

yargs.recommendCommands()
yargs.showHelpOnFail(true)

const argv = yargs.argv

if (argv._.length === 0) {
  yargs.showHelp()
  process.exit(1)
}
