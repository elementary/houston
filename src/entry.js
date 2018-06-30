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

const program = require('commander')

const config = require('lib/config').default
const database = require('lib/database/connection').default

const databaseOptions = {
  server: {
    socketOptions: {
      autoReconnect: true,
      connectTimeoutMS: 30000,
      keepAlive: 1
    }
  }
}

program
  .command('flightcheck')
  .description('starts flightcheck to listen for requests from houston')
  .action(() => {
    database.connect(config.database, databaseOptions)

    require('./flightcheck/index')
  })

program
  .command('houston')
  .description('starts the houston web server')
  .option('-p, --port <port>', 'Port to listen on', config.server.port)
  .action((opts) => {
    const app = require('./houston').default

    database.connect(config.database, databaseOptions)
    app.listen(opts.port)
  })

program
  .command('refuel')
  .description('starts the process for updating the stable repository')
  .action((opts) => {
    const refuel = require('./refuel')

    refuel.start()
  })

program
  .command('telemetry')
  .description('starts nginx syslog server for download statistics')
  .option('-p, --port <port>', 'Port to listen on', config.telemetry.port)
  .action((opts) => {
    const telemetry = require('./telemetry/server').default

    telemetry.on('error', (err) => {
      console.error(err)
      process.exit(1)
    })

    database.connect(config.database, databaseOptions)
    telemetry.bind({
      port: opts.port
    }, (err) => {
      if (err != null) {
        console.error(err)
        process.exit(1)
      }
    })
  })

program
  .version(config.houston.version)
  .parse(process.argv)

if (!program.args.length) {
  program.help()
  process.exit(1)
}
