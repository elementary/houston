/**
 * refuel/index.js
 * Updates repository every 15 minutes
 * @flow
 *
 * @exports {Number} delay - Delay to run function
 * @exports {Function} start - Starts timer for updating repository
 * @exports {Function} stop - Stops the timer
 */

import superagent from 'superagent'

import { errorCheck } from 'service/aptly'
import config from 'lib/config'
import Log from 'lib/log'

export const delay = 15 * 60 * 1000 // Run every 15 minutes

const log = new Log('refuel')
let interval = null

const publish = async (repo, dist) => {
  return superagent
    .put(`${config.aptly.url}/publish/${repo}/${dist}`)
    .set('User-Agent', 'elementary-houston')
    .send({
      Signing: {
        Batch: true,
        Passphrase: config.aptly.passphrase
      }
    })
    .catch((err, res) => {
      throw errorCheck(err, res)
    })
}

/**
 * run
 * Starts timer for updating repository
 *
 * @returns {Void}
 */
export function start () {
  log.debug('Starting interval')

  interval = setInterval(async () => {
    log.debug('Updating repository')

    try {
      await publish(config.aptly.stable({ distribution: 'loki' }).prefix, 'xenial')
      await publish(config.aptly.stable({ distribution: 'juno' }).prefix, 'bionic')
      await publish(config.aptly.review({ distribution: 'loki' }).prefix, 'xenial')
      await publish(config.aptly.review({ distribution: 'juno' }).prefix, 'bionic')
    } catch (err) {
      log.error('Unable to publish repository', err)
    }
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
