/**
 * entry.js
 * Simple wrapper for babel and CLI commands
 */

// Disable eslint no-console rule so everything looks like a normal cli program
/* eslint-disable no-console */

import './bootstrap'

import program from 'commander'

import config from 'lib/config'
import database from 'lib/database/connection'
import Pipeline from 'flightcheck/pipeline'

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
    require('./flightcheck/houston')
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
  .version(config.houston.version)
  .parse(process.argv)

if (!program.args.length) {
  program.help()
  process.exit(1)
}
