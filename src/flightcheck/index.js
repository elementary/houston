/**
 * flightcheck/index.js
 * Client for running appHooks
 */

import path from 'path'

import * as fsHelper from '~/lib/helpers/fs'
import * as local from '~/lib/local'
import Atc from '~/lib/atc'
import config from '~/lib/config'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'

const projectsFolder = path.resolve(__dirname, 'projects')

/**
 * runHooks
 * Runs hook with given package of data and returns compressed information
 *
 * @param {Object} data - {
 *   {String} repo - git repo 'git@github.com:elementary/houston.git'
 *   {String} tag - git tag for given repo 'master'
 *   {String} name - project name
 *   {String} version - project version we are testing
 *   {Array} changelog - changelog object for current release testing
 * }
 * @param {String} test - type of test to be ran ("pre")
 * @returns {Object} - {
 *   {Number} errors - number of errors the hooks aquired
 *   {Number} warnings - number of warnings the hook aquired
 *   {Object} information - information to be updated in the database
 *   {Array} issues - generated issues for GitHub with title and body
 * }
 */
const runHooks = async (data, test) => {
  data.name = escape(data.name.replace(/[\/]/gi, ''))
  data.tag = escape(data.tag.replace(/[\/]/gi, ''))

  const projectFolder = path.resolve(projectsFolder, `${data.name}#${data.tag}`)

  const hooks = await fsHelper.walk(path.join(__dirname, '..', 'pipes'), (path) => {
    if (path.indexOf('/') === -1) return false
    if (path.split('/')[0] === 'projects') return false
    return path.indexOf(`${test.toLowerCase()}.js`) !== -1
  })
  .map((file) => {
    const Hook = require(path.join(__dirname, file)).default
    return new Hook(Object.assign(data, { folder: projectFolder }))
  })

  return local.cmd(`rm -rf ${projectFolder}`)
  .then(() => local.cmd(`mkdir -p ${projectFolder}`))
  .then(() => local.cmd(`git clone ${data.repo} ${projectFolder}`))
  .then(() => local.cmd(`git --git-dir=${projectFolder}/.git --work-tree=${projectFolder} checkout ${data.tag}`))
  .then(() => local.cmd(`rm -rf ${projectFolder}/.git`))
  .then(() => Promise.all(hooks).map((hook) => hook.run()))
  .then((pkg) => {
    const obj = {errors: 0, warnings: 0, information: {}, issues: []}

    pkg.forEach((hookPkg) => {
      obj.errors = hookPkg.errors + obj.errors
      obj.warnings = hookPkg.warnings + obj.warnings
      obj.information = Object.assign(obj.information, hookPkg.information)
      if (hookPkg.issue != null) obj.issues.push(hookPkg.issue)
    })

    return obj
  })
  .catch((err) => {
    throw new Mistake(500, 'flightcheck ran into an error running tests', err, true)
  })
  .finally(() => { // Clean up all left over files
    log.debug(`Cleaning up for ${data.name}#${data.tag}`)

    return local.cmd(`rm -rf ${projectFolder}`)
  })
}

const connection = new Atc('flightcheck')
connection.connect(config.server.url)

log.info('Flightcheck running')

/**
 * Runs hook with given package of data and returns compressed information
 *
 * @param {Object} data - {
 *   {ObjectId} id - cycle database id
 *   {String} repo - git repo 'git@github.com:elementary/houston.git'
 *   {String} tag - git tag for given repo 'master'
 *   {String} name - project name
 *   {String} version - project version we are testing
 *   {Array} changelog - changelog object for current release testing
 * }
 * @returns {ObjectId} - cycle database id
 * @returns {Object} - {
 *   {Number} errors - number of errors the hooks aquired
 *   {Number} warnings - number of warnings the hook aquired
 *   {Object} information - information to be updated in the database
 *   {Array} issues - generated issues for GitHub with title and body
 * }
 */
connection.on('cycle:queue', (data) => {
  log.debug(`Starting flightcheck on ${data.name}`)
  connection.send('houston', 'cycle:start', data.id, true)

  runHooks(data, 'pre')
  .then((pkg) => {
    log.debug(`Found ${log.lang.s('error', pkg.errors)} in ${data.name}`)
    connection.send('houston', 'cycle:finish', data.id, pkg)
  })
  .catch((error) => {
    log.warn(`Error running tests for ${data.name}`, error)
    connection.send('houston', 'cycle:error', data.id, error)
  })
})
