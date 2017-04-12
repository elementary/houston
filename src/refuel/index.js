/**
 * refuel/index.js
 * Updates repository every 15 minutes
 * @flow
 *
 * @exports {Number} delay - Delay to run function
 * @exports {Function} start - Starts timer for updating repository
 * @exports {Function} stop - Stops the timer
 */

import { publish } from 'service/aptly'
import config from 'lib/config'
import Log from 'lib/log'

export const delay = 15 * 60 * 1000 // Run every 15 minutes

const log = new Log('refuel')
let interval = null

/**
 * run
 * Starts timer for updating repository
 *
 * @returns {Void}
 */
export function start () {
  log.debug('Starting interval')

  interval = setInterval(() => {
    log.debug('Updating repository')

    try {
      publish(config.aptly.stable)
    } catch (err) {
      log.error('Unable to publish repository', err)
    }

    start()
  }, delay)
}

/**
 * stop
 * Stops the timer for updating repository
 *
 * @returns {Void}
 */
export function stop () {
  // FLOW disable next line due to null checks
  clearInterval(interval)
  interval = null
}
