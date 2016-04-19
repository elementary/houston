/**
 * strongback/index.js
 * Client for building packages in a docker environment
 */

import Atc from '~/lib/atc'
import config from '~/lib/config'
import log from '~/lib/log'

// Start a new atc connection
const connection = new Atc('strongback')
connection.connect(config.server.url)

log.info('Strongback running')

connection.on('build:start', (data) => {
  log.debug(`Starting build for ${data.repo}#${data.tag}`)

  connection.send('houston', 'build:finished')
})
