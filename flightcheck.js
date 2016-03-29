/**
 * flightcheck.js
 * Starts a Atc connection to receive flightcheck requests
 */

import atc from './lib/atc'
import checks from './flightcheck/'
import { Helpers, Config, Log } from './app'

atc.init('client', Config.server.url)

atc.on('cycle:start', (data) => {
  Log.debug(`Starting flightcheck on ${data.project.name}`)

  checks(data)
  .then((pkg) => {
    atc.send('cycle:finished', pkg)

    Log.debug(`Found ${Helpers.ArrayString('error', pkg.errors)} in ${data.project.name}`)
  })
})
