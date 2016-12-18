/**
 * entry.js
 * Simple wrapper for babel and CLI commands
 */

// Disable eslint no-console rule so everything looks like a normal cli program
/* eslint-disable no-console */

// Polyfill all of the new and fun javascript features for lesser versions
// TODO: remove the need for polyfill
require('babel-polyfill')

// The code forced me to overwrite native functions. I'm sorry
// TODO: move all promise logic to async native, to remove the need for bluebird
// @see https://github.com/elementary/houston/issues/189
global.Promise = require('bluebird')

import program from 'commander'

import config from 'lib/config'
import Pipeline from 'flightcheck/pipeline'

// TODO: allow options for port and other common config options
program
  .version(config.houston.version)

program
  .command('houston')
  .description('starts the houston web server')
  .action(() => {
    require('./houston')
  })

program
  .command('flightcheck')
  .description('starts flightcheck to listen for requests from houston')
  .action(() => {
    require('./flightcheck/houston')
  })

program
  .command('build <repo> <tag> [auth]')
  .description('runs a single build with flightcheck')
  .action((repo, tag, auth, opt) => {
    if (opt == null) {
      opt = auth
      auth = null
    }

    if (repo == null || tag == null) {
      program.help()
      process.exit(1)
    }

    const pipeline = new Pipeline({ repo, tag, auth })

    pipeline.start()
    .catch((err) => {
      console.error(err)
      process.exit(2)
    })
  })

program
  .parse(process.argv)

if (!program.args.length) {
  program.help()
  process.exit(1)
}
