/**
 * houston/controller/hook/flightcheck.js
 * Handles all communcation from atc flightcheck connections
 */

import atc from '~/houston/service/atc'
import Cycle from '~/houston/model/cycle'
import log from '~/lib/log'
import Project from '~/houston/model/project'

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

  cycle.setStatus('PRE')
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

  if (status !== 'PRE') {
    log.debug('Received flightcheck finish data for a cycle already checked')
    return
  }

  log.verbose('Received flightcheck data for finish cycle')
  log.debug(`Found ${log.lang.s('error', data.errors)} in ${cycle.name}`)
  data.issues.forEach((issue) => {
    log.silly(issue)
  })

  if (data.errors > 0) {
    cycle.setStatus('FAIL')
  } else {
    cycle.setStatus('DEFER')
  }

  const project = await Project.findById(cycle.project)
  Promise.each(data.issues, (issue) => project.postIssue(issue))

  // TODO: we should whitelist what can be updated in the database
  if (data.information != null && Object.getOwnPropertyNames(data.information).length > 0) {
    project.update(data.information).exec()
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

  if (status !== 'PRE') {
    log.debug('Received flightcheck error data for a cycle already checked')
    return
  } else {
    log.verbose('Received flightcheck data for error cycle')
  }

  cycle.setStatus('ERROR')
  .then(() => cycle.update({ mistake: error }))
})
