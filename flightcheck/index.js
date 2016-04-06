/**
 * flightcheck/index.js
 * Client for running appHooks
 */

import * as fsHelper from '~/lib/helpers/fs'
import atc from '~/lib/atc'
import config from '~/lib/config'
import log from '~/lib/log'

/**
 * runHooks
 * Runs hook with given package of data and returns compressed information
 *
 * @param {Object} data - {
 *   {String} repo - git repo 'git@github.com:elementary/houston.git'
 *   {String} tag - git tag for given repo 'master'
 *   {Object} project - database document of a project
 *   {Object} release - database document of a release
 *   {Object} cycle - database document of a cycle
 * }
 * @param {String} test - type of test to be ran ("pre")
 * @returns {Object} - {
 *   {String} cycle - database id for cycle
 *   {String} project - database id for project
 *   {String} release - database id for release
 *   {Number} errors - number of errors the hooks aquired
 *   {Number} warnings - number of warnings the hook aquired
 *   {Object} information - information to be updated in the database
 *   {Array} issues - generated issues for GitHub with title and body
 * }
 */
const runHooks = async (data, test) => {
  const hooks = await fsHelper.walk('flightcheck', (path) => path.indexOf(`${test.toLowerCase()}.js`) !== 0)
  console.log(hooks)
  const tests = hooks.map(Hook => {
    return new Hook(data).run()
  })

  return Promise.all(tests)
  .catch(err => log.error(err))
  .then(pkg => {
    let obj = {errors: 0, warnings: 0, information: {}, issues: []}

    for (let i in pkg) {
      obj.errors = pkg[i].errors + obj.errors
      obj.warnings = pkg[i].warnings + obj.warnings
      obj.information = Object.assign(obj.information, pkg[i].information)
      if (pkg[i].issue != null) obj.issues.push(pkg[i].issue)
    }

    return obj
  })
  .then(pkg => {
    return Object.assign({
      cycle: data.cycle._id,
      project: data.project._id,
      release: (data.release != null) ? data.release._id : null
    }, pkg)
  })
}

// Starts atc communication
atc.init('client', config.server.url)

atc.on('cycle:start', (data) => {
  log.debug(`Starting flightcheck on ${data.project.name}`)

  runHooks(data, 'pre')
  .then((pkg) => {
    atc.send('cycle:finished', pkg)

    log.debug(`Found ${log.lang.s('error', pkg.errors)} in ${data.project.name}`)
  })
})
