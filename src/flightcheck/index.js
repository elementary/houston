/**
 * flightcheck/index.js
 * Selects the interface to run based on command arguments
 */

import fs from 'fs'

import config from 'lib/config'
import Log from 'lib/log'

const log = new Log('flightcheck')

// Check docker is running, active, and accessable before we start anything
fs.stat(config.flightcheck.docker, (err, stat) => {
  if (err != null || !stat.isSocket()) {
    log.error(`Unable to connect to Docker at ${config.flightcheck.docker}`)
    log.error('Please make sure it is active and accessable for Flightcheck')

    if (err) log.error(err)

    process.exit(-1)
  }

  // This is the index of the flightcheck script in our command arguments
  const currentIndex = process.argv.findIndex((arg) => {
    return (arg.indexOf('flightcheck') !== -1)
  })

  // I have no clue what is happening so we are just going to go with it
  if (currentIndex == null || currentIndex === -1) {
    require('./interfaces/houston')

    return
  }

  // No arguments given past flightcheck script ¯\_(ツ)_/¯
  if (process.argv[currentIndex + 1] == null) {
    require('./interfaces/houston')

    return
  }

  if (process.argv[currentIndex + 1] === 'houston') {
    require('./interfaces/houston')

    return
  }

  require('./interfaces/cli')
})
