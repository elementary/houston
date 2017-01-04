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

import path from 'path'
import program from 'commander'

import alias from 'root/.alias'
import config from 'lib/config'

config.loadGenerated()

/**
 * loadConfigOptions
 * Sets up configuration object with options passed by program
 *
 * @return {Void}
 */
const loadConfigOptions = () => {
  if (program.config != null) {
    const configPath = path.resolve(process.cwd(), program.config)

    try {
      config.loadFile(configPath)
    } catch (err) {
      console.error(`Unable to load configuration file "${configPath}"`)
      console.error(err.toString())
      process.exit(1)
    }
  } else {
    const triedPaths = []

    /**
     * tryPath
     * Tries to load configuration file Path. If it failes
     *
     * @param {String} p - path of configuration file
     * @returns {Void}
     */
    const tryPath = (p) => {
      if (config.file != null) return

      try {
        config.loadFile(p)
      } catch (e) {
        triedPaths.push(p)
      }
    }

    tryPath(path.resolve(alias.resolve.alias['root'], 'config.js'))
    tryPath(path.resolve(process.env['HOME'], '.houston.js'))
    tryPath(path.resolve('etc', 'houston.js'))

    if (config.file == null) {
      console.error('Unable to load configuration file. The following paths were tried:')
      triedPaths.forEach((p) => console.error(`  ${p}`))
      process.exit(1)
    }
  }

  config.loadEnv()
  config.loadGenerated()

  if (program.env != null) config.set('env', program.env)
  if (program.log != null) config.set('log', program.log)
  if (program.port != null) {
    config.set('server.port', program.port)
    config.set('downloads.port', program.port)
  }

  const missingKeys = config.check()

  if (missingKeys.length !== 0) {
    console.error('Missing configuration. The following keys are missing:')
    missingKeys.forEach((k) => console.error(`  ${k}`))
    process.exit(1)
  }

  config.immutable = true
}

program
  .command('houston')
  .description('starts the houston web server')
  .action(() => {
    loadConfigOptions()
    require('./houston')
  })

program
  .command('flightcheck')
  .description('starts flightcheck to listen for requests from houston')
  .action(() => {
    loadConfigOptions()
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

    loadConfigOptions()
    const Pipeline = require('./flightcheck/pipeline').default
    const pipeline = new Pipeline({ repo, tag, auth })

    pipeline.start()
    .catch((err) => {
      console.error(err)
      process.exit(2)
    })
  })

program
  .version(config.get('houston.version'))
  .usage('[command]')
  .option('-c, --config <path>', 'Path for configuration file')
  .option('-e, --env <value>', 'Environment to run on', /^(test|development|production)$/i)
  .option('-l, --log <value>', 'Console log level', /^(debug|info|warn|error)$/i)
  .option('-p, --port <n>', 'Port to start server on')
  .parse(process.argv)

if (!program.args.length) {
  program.help()
  process.exit(1)
}
