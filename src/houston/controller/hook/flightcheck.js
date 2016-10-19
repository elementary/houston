/**
 * houston/controller/hook/flightcheck.js
 * Handles all communcation from atc flightcheck connections
 */

import * as atc from 'lib/atc'
import Cycle from 'houston/model/cycle'
import Log from 'lib/log'
import Project from 'houston/model/project'

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

  if (status !== 'QUEUE') {
    log.debug('Received flightcheck start data for a cycle already checked')
    return
  }

  log.debug('Received flightcheck data for start cycle')
  await cycle.setStatus('RUN')
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
  const status = await cycle.getStatus()

  if (status !== 'RUN') {
    log.debug('Received flightcheck finish data for a cycle not running')
    return
  }

  log.debug(`Received flightcheck data for finish cycle ${param.id}`)
  log.debug(`Found ${param.logs.length} logs in ${cycle.name}`)
  param.logs.forEach((l) => {
    log.debug(`${l.pipe} ${l.level} log => ${l.title}`)
    log.debug(`\n${l.body}`)
  })

  const errors = param.logs.filter((l) => (l.level === 'error'))

  if (param.apphub !== null) {
    log.debug(`Updating ${cycle.name} project apphub object`)

    await Project.findByIdAndUpdate(cycle.project, {
      'apphub': param.apphub,
      'github.label': param.apphub.log.label
    })
  }

  if (errors.length > 0) {
    log.debug(`Failing ${cycle.name} due to error logs`)
    return cycle.setStatus('FAIL')
  }

  if (param.aptly == null || param.aptly.publishedKeys.length < 1) {
    log.debug(`${cycle.name} has no aptly published keys. Setting to finished`)
    return cycle.setStatus('FINISH')
  } else {
    log.debug(`Updating ${cycle.name} aptly file keys and setting to review`)
    await cycle.update({
      'packages': param.aptly.publishedKeys
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
  const status = await cycle.getStatus()

  if (status !== 'RUN') {
    log.debug('Received flightcheck error data for a cycle not running')
    return
  } else {
    log.debug('Received flightcheck data for error cycle')
  }

  await cycle.setStatus('ERROR')
  await cycle.update({ mistake: param.error })
})

worker.start()
