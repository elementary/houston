/**
 * houston/controller/hook/flightcheck.js
 * Handles all communcation from atc flightcheck connections
 */

import atc from 'houston/service/atc'
import Cycle from 'houston/model/cycle'
import log from 'lib/log'
import Project from 'houston/model/project'

/**
 * Updates cycle when it starts to be tested
 *
 * @param {ObjectId} id - cycle database id
 * @param {Boolean} data - true if test starts
 */
atc.on('cycle:start', async (id, data) => {
  const cycle = await Cycle.findById(id)
  const status = await cycle.getStatus()

  if (status !== 'QUEUE') {
    log.debug('Received flightcheck start data for a cycle already checked')
    return
  } else {
    log.verbose('Received flightcheck data for start cycle')
  }

  cycle.setStatus('RUN')
})

/**
 * Updates a completed cycle database information
 *
 * @param {ObjectId} id - cycle database id
 * @param {Object} data - {
 *   {Number} errors - number of errors the hooks aquired
 *   {Number} warnings - number of warnings the hook aquired
 *   {Object} information - information to be updated in the database
 *   {Array} issues - generated issues for GitHub with title and body
 * }
 */
atc.on('cycle:finish', async (id, data) => {
  const cycle = await Cycle.findById(id)
  const status = await cycle.getStatus()

  if (status !== 'RUN') {
    log.debug('Received flightcheck finish data for a cycle already checked')
    return
  }

  log.verbose('Received flightcheck data for finish cycle')
  log.debug(`Found ${log.lang.s('log', data.logs)} in ${cycle.name}`)
  data.logs.forEach((l) => {
    log.verbose(`${l.pipe} ${l.level} log => ${l.title}`)
    log.silly(`\n${l.body}`)
  })

  const errors = data.logs.filter((l) => (l.level === 'error'))

  if (data.apphub !== null) {
    log.debug(`Updating ${cycle.name} project apphub object`)
    await Project.findByIdAndUpdate(cycle.project, {
      'apphub': data.apphub,
      'github.label': data.apphub.log.label
    })
  }

  if (errors.length > 0) {
    log.debug(`Failing ${cycle.name} due to error logs`)
    return cycle.setStatus('FAIL')
  }

  if (data.aptly == null || data.aptly.publishedKeys.length < 1) {
    log.debug(`${cycle.name} has no aptly published keys. Setting to finished`)
    return cycle.setStatus('FINISH')
  } else {
    log.debug(`Updating ${cycle.name} aptly file keys and setting to review`)
    await cycle.update({
      'packages': data.aptly.publishedKeys
    })

    return cycle.setStatus('REVIEW')
  }
})

/**
 * Updates a cycle with error
 *
 * @returns {ObjectId} id - cycle database id
 * @returns {Error} error - error that occured during testing
 */
atc.on('cycle:error', async (id, error) => {
  const cycle = await Cycle.findById(id)
  const status = await cycle.getStatus()

  if (status !== 'RUN') {
    log.debug('Received flightcheck error data for a cycle already checked')
    return
  } else {
    log.verbose('Received flightcheck data for error cycle')
  }

  cycle.setStatus('ERROR')
  .then(() => cycle.update({ mistake: error }))
})
