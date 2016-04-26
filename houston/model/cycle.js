/**
 * houston/model/cycle.js
 * Mongoose schema for cycles
 *
 * @exports {Object} - cycle database model
 * @exports {Object} schema - cycle database schema
 */

import semver from 'semver'

import * as aptly from '~/houston/service/aptly'
import atc from '~/houston/service/atc'
import buildSchema from './build'
import db from '~/lib/database'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'

/**
 * Stores cycle information. 1 cycle = 1 project being built = many builds
 *
 * @param {String} repo - git repo of cycle (git@github.com:elementary/vocal.git)
 * @param {String} tag - git tag to build (master)
 * @param {String} name - project name (vocal)
 * @param {String} version - semver version of cycle (1.0.0)
 * @param {String} type - cycle type (INIT = up to flightcheck, ORPHAN = up to strongback)
 * @param {String} changelog
 * @param {String} _status - current status of cycle without influence of builds
 * @param {Object} mistake - mistake class error if any occured
 * @param {Array} builds - all builds under this cycle
 */
const schema = new db.Schema({
  repo: {
    type: String,
    validate: {
      validator: (s) => /.*\.git/.test(s),
      message: '{VALUE} is not a valid git repository'
    }
  },
  tag: {
    type: String,
    required: true
  },

  name: {
    type: String,
    required: true
  },
  version: {
    type: String,
    validate: {
      validator: (s) => semver.valid(s) !== null,
      message: '{VALUE} is not a semver valid version'
    }
  },

  type: {
    type: String,
    required: true,
    enum: ['INIT', 'ORPHAN', 'RELEASE']
  },

  changelog: {
    type: String,
    required: true
  },

  _status: {
    type: String,
    default: 'QUEUE',
    enum: ['QUEUE', 'PRE', 'DEFER', 'REVIEW', 'FINISH', 'FAIL', 'ERROR']
  },
  mistake: Object,

  builds: [buildSchema]
})

/**
 * getStatus
 * Returns status as promised
 *
 * @returns {String} status of cycle
 */
schema.methods.getStatus = async function () {
  if (this._status !== 'DEFER') {
    return Promise.resolve(this._status)
  }

  const options = buildSchema.paths._status.enumValues
  return Promise.map(this.builds, (build) => build.getStatus())
  .then((stati) => {
    return stati.sort((one, two) => {
      if (one === 'FINISH') return 1
      if (two === 'FINISH') return -1

      return (options.indexOf(two) - options.indexOf(one))
    })
  })
  .then((sorted) => sorted[0])
}

/**
 * setStatus
 * Sets status as promised
 *
 * @param {String} status - new status of cycle
 * @returns {Object} mongoose query of update
 */
schema.methods.setStatus = function (status) {
  // TODO: add a build stopper function to allow early failing of cycles
  if (this._status === 'DEFER' && status !== 'ERROR') {
    return Promise.reject('Unable to set status on a cycle with outstanding builds')
  }

  const options = schema.paths._status.enumValues
  if (this.type === 'INIT' && options.indexOf(status) >= 2) {
    return Promise.reject('Unable to set status past "PRE" on "INIT" type cycles')
  }
  if (this.type === 'ORPHAN' && options.indexOf(status) >= 3) {
    return Promise.reject('Unable to set status past "REVIEW" on "ORPHAN" type cycles')
  }

  return this.update({ _status: status }).exec()
}

/**
 * doCycle
 * Sets all build information to flightcheck for pre testing
 */
schema.methods.doCycle = function () {
  return atc.send('flightcheck', 'cycle:start', {
    repo: this.repo,
    tag: this.tag,
    name: this.name,
    version: this.version,
    changelog: this.changelog
  })
  .then(() => {
    log.debug(`Flightchecking ${this.name}`)
  })
  .catch((err) => {
    log.warn(`Automated flightchecking of ${this.name} has failed`)

    const mistake = new Mistake(500, 'Automated flightchecking failed', err)

    this.update({
      status: 'ERROR',
      mistake
    })
    .then(() => {
      throw mistake
    })
  })
}

export { schema }
export default db.model('cycle', schema)
