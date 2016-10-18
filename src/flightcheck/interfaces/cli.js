/**
 * flightcheck/interface/cli.js
 * Runs flightcheck from cli. Used for mostly testing purposes
 */

import Log from 'lib/log'
import Pipeline from 'flightcheck/pipeline'

const log = new Log('flightcheck')

log.debug('Loaded')

/**
 * help
 * prints out cli help information
 *
 * @returns {Void}
 */
const help = function () {
  // eslint-disable-next-line no-console
  console.error(`
    Usage: flightcheck <repo> <tag> [auth]

    Runs flightcheck for a given repository

    Examples:

      flightcheck git@github.com:vocalapp/vocal 2.0.6-beta
      flightcheck https://github.com/birdieapp/birdie 1.1 1337
  `)
}

// Find index of flightcheck so we can gether the next argument
const cI = process.argv.findIndex((arg) => {
  return (arg.indexOf('flightcheck') !== -1)
})

if (cI === -1) {
  log.error('Unable to determine script arguments')
  process.exit(-1)
}

if (process.argv[cI + 1] === '-h' || process.argv[cI + 1] === '--help') {
  help()
  process.exit(0)
}

const repo = process.argv[cI + 1] // git@github.com:vocalapp/vocal
const tag = process.argv[cI + 2] // 1.0.0
const auth = process.argv[cI + 3] // thisisanauthenticationkey

if (repo == null || tag == null) {
  log.error('Insufficient command line arguments given')
  help()
  process.exit(-1)
}

if (auth == null) {
  log.warn('Running without an authentication key')
}

log.info(`Running ${repo} for ${tag}`)

const pipeline = new Pipeline({
  repo,
  tag,
  auth
})

pipeline.start()
.then(() => {
  log.info('complete!')
  log.debug(`Ran ${pipeline.pipes.length} pipes`)
})
.catch((err) => {
  log.error(err)
  process.exit(-1)
})
