/**
 * appHooks/index.js
 * script for conducting appHooks
 *
 * @exports {Object} run - run appHooks with given data
 */

import Promise from 'bluebird'

import { Log } from '~/app'

let fs = Promise.promisifyAll(require('fs'))

/**
 * getHooks
 * A Convenience function for going through file tree and finding hooks
 *
 * @param {String} lvl - level of hook 'pre' 'post' 'build' etc
 * @returns {Array} - Array of required appHook classes
 */
function getHooks (lvl) {
  const level = lvl.toLowerCase()
  return fs.readdirAsync(__dirname)
  .filter(path => {
    return fs.statAsync(`${__dirname}/${path}`)
    .then(stat => stat.isDirectory())
  })
  .filter(dir => {
    return fs.statAsync(`${__dirname}/${dir}/${level}.js`)
    .then(stat => stat.isFile())
    .catch(() => false)
  })
  .map(dir => {
    return require(`${__dirname}/${dir}/${level}.js`)
  })
}

/**
 * run
 * Runs hook with given package of data and returns compressed information
 *
 * @param {Object} data -{
 *   {String} repo - git repo 'git@github.com:elementary/houston.git'
 *   {String} tag - git tag for given repo 'master'
 *   {Object} project - database document of a project
 *   {Object} release - database document of a release
 *   {Object} cycle - database document of a cycle
 * }
 * @returns {Object} {
 *   {String} cycle - database id for cycle
 *   {String} project - database id for project
 *   {String} release - database id for release
 *   {Number} errors - number of errors the hooks aquired
 *   {Number} warnings - number of warnings the hook aquired
 *   {Object} information - information to be updated in the database
 *   {Array} issues - generated issues for GitHub with title and body
 * }
 */
export async function run (data) {
  const hooks = await getHooks(data.status)
  const tests = hooks.map(Hook => {
    return new Hook(data).run()
  })

  return Promise.all(tests)
  .catch(err => Log.error(err))
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
