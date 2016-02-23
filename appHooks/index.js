/**
 * appHooks/index.js
 * script for conducting appHooks
 *
 * @exports {Object} run - run appHooks with given data
 */

import Promise from 'bluebird'
import _ from 'lodash'

import { Log } from '~/app'

let fs = Promise.promisifyAll(require('fs'))

function getHooks (lvl) {
  const level = lvl.toLowerCase()
  return Promise.all(fs.readdirSync(__dirname))
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

export async function run (data) {
  let hooks = await getHooks(data.status)
  let tests = []

  for (let i in hooks) {
    let Hook = new hooks[i](data)
    tests.push(Hook.run())
  }

  return Promise.all(tests)
  .catch(err => Log.error(err))
  .then(pkg => {
    let obj = {errors: 0, warnings: 0, information: {}, issues: []}

    for (let i in pkg) {
      obj.errors = pkg[i].errors + obj.errors
      obj.warnings = pkg[i].warnings + obj.warnings
      obj.information = _.extend(obj.information, pkg[i].information)
      if (pkg[i].issue != null) obj.issues.push(pkg[i].issue)
    }

    return obj
  })
  .then(pkg => {
    return _.extend({
      cycle: data.cycle._id,
      project: data.project._id,
      release: (data.release != null) ? data.release._id : null
    }, pkg)
  })
}
