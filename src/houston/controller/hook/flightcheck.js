/**
 * houston/controller/hook/flightcheck.js
 * Handles all communcation from atc flightcheck connections
 */

import * as atc from 'lib/atc'
import Cycle from 'lib/database/cycle'
import Log from 'lib/log'

const log = new Log('controller:hook:flightcheck')
const worker = new atc.Worker('cycle')

/**
 * Updates cycle when it starts to be tested
 *
 * @param {Object} param - details sent by flightcheck
 * @param {ObjectId} param.id - cycle database id
 */
worker.register('start', async (param) => {
  const cycle = await Cycle.findById(param.id)
  const status = await cycle.getStatus()

  if (status === 'QUEUE') {
    log.debug('Received flightcheck data for start cycle')
    await cycle.setStatus('RUN')
  }
})

/**
 * Updates a completed cycle database information
 *
 * @param {Object} param - data sent by flightcheck on finish
 * @param {ObjectId} param.id - cycle database id
 * @param {Object} param.apphub - AppHub Pipe result data
 * @param {Object} param.aptly - ElementaryAptly Pipe result data
 * @param {Object}[] param.logs - a list of all logs outputed during Pipeline
 */
worker.register('finish', async (param) => {
  const cycle = await Cycle.findById(param.id)

  log.debug(`Received flightcheck data for finish cycle ${param.id}`)
  log.debug(`Found ${param.logs.length} logs in ${cycle.name}`)
  param.logs.forEach((l) => {
    log.debug(`${l.level} log => ${l.title}`)
    if (l.body != null) {
      log.debug(`\n${l.body}`)
    }
  })

  // In houston v1, level was a string, in v2 it's an enum which maps to number
  const errors = param.logs.filter((l) => (l.level === 3))

  if (errors.length > 0) {
    log.debug(`Failing ${cycle.name} due to error logs`)
    return cycle.setStatus('FAIL')
  }

  if (param.packages == null || param.packages.length < 1) {
    log.debug(`${cycle.name} has no aptly published keys. Setting to finished`)
    return cycle.setStatus('FINISH')
  } else {
    log.debug(`Updating ${cycle.name} aptly file keys and setting to review`)
    await cycle.update({
      'packages': param.packages
    })

    return cycle.setStatus('REVIEW')
  }
})

/**
 * Updates a cycle with error
 *
 * @returns {Object} param - data sent by an errored flightcheck cycle
 * @returns {ObjectId} param.id - cycle database id
 * @returns {Error} param.error - error that occured during testing
 */
worker.register('error', async (param) => {
  const cycle = await Cycle.findById(param.id)

  log.debug('Received flightcheck data for error cycle')

  await cycle.setStatus('ERROR')
  await cycle.update({ mistake: param.error })
})

worker.start()
