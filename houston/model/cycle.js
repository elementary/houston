/**
 * houston/model/cycle.js
 * Mongoose schema for cycles
 *
 * @exports {Object} - cycle database model
 * @exports {Object} schema - cycle database schema
 */

import semver from 'semver'

import atc from '~/houston/service/atc'
import buildSchema from './build'
import db from '~/lib/database'
import Mistake from '~/lib/mistake'

/**
 * Stores cycle information. 1 cycle = 1 project version being built = many builds
 *
 * @param {String} repo - git repo of cycle (git@github.com:elementary/vocal.git)
 * @param {String} tag - git tag to build (master)
 * @param {String} name - project name (vocal)
 * @param {String} version - semver version of cycle (1.0.0)
 * @param {String} type - cycle type (INIT = up to flightcheck, ORPHAN = up to strongback)
 * @param {String} changelog
 * @param {Array} packages - array of aptly package keys
 * @param {String} _status - current status of cycle without influence of builds
 * @param {Object} mistake - mistake class error if any occured
 * @param {Array} builds - all builds under this cycle
 */
const schema = new db.Schema({
  project: {
    type: db.Schema.Types.ObjectId,
    required: true
  },

  repo: {
    type: String,
    required: true,
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
    required: true,
    index: true
  },
  version: {
    type: String,
    index: true,
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
    type: Array,
    required: true
  },
  packages: Array,

  _status: {
    type: String,
    default: 'QUEUE',
    enum: ['QUEUE', 'PRE', 'DEFER', 'REVIEW', 'FINISH', 'FAIL', 'ERROR']
  },
  mistake: Object,

  builds: [buildSchema]
})

/**
 * toNormal
 * Async notmalization function for objects
 *
 * @returns {Object} - a promise of a better object
 */
schema.methods.toNormal = async function () {
  const ret = this.toObject()
  const status = await this.getStatus()
  const builds = await Promise.map(this.builds, (build) => build.toObject())

  ret['id'] = ret['_id']
  ret['status'] = status
  ret['builds'] = builds

  delete ret['_id']
  delete ret['__v']
  delete ret['_status']
  delete ret['repo'] // It possibly has access token for cloning

  if (ret['mistake'] != null && ret['mistake']['stack'] != null) {
    delete ret['mistake']['stack']
  }

  return ret
}

/**
 * toJSON
 * Overwrites built in mongoose toJSON function for better plain object support
 *
 * @param {Object} doc - mongoose document object to transform
 * @param {Object} ret - the plain object representation of the document
 * @param {Object} opt - options passed by schema or inline
 * @returns {Object} - a promise of a better object
 */
schema.set('toJSON', {
  getters: false,
  virtuals: false,
  transform: async (doc, ret, opt) => {
    const obj = await doc.toObject()

    return JSON.stringify(obj, opt)
  }
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
 * @returns {Object} mongoose update promise
 */
schema.methods.setStatus = function (status) {
  // TODO: add a build stopper function to allow early failing of cycles
  const final = (status === 'FINISH' || status === 'FAIL' || status === 'ERROR')
  const options = schema.paths._status.enumValues

  if (options.indexOf(this._status) >= options.indexOf(status)) {
    return Promise.reject('Status is already greater than requested')
  }

  if (this.type === 'INIT' && (!final || options.indexOf(status) >= 2)) {
    return Promise.reject('Unable to set status past "PRE" on "INIT" type cycles')
  }
  if (this.type === 'ORPHAN' && (!final || options.indexOf(status) >= 3)) {
    return Promise.reject('Unable to set status past "REVIEW" on "ORPHAN" type cycles')
  }

  return this.update({ _status: status })
  .then((data) => {
    if (data.nModified === 1) this._status = status

    if (status === 'DEFER') {
      return this.doStrongback()
      .then(() => data)
    }

    return data
  })
}

/**
 * doFlightcheck
 * Sets all build information to flightcheck for pre testing
 */
schema.methods.doFlightcheck = function () {
  return atc.send('flightcheck', 'cycle:queue', {
    id: this._id,
    repo: this.repo,
    tag: this.tag,
    name: this.name,
    version: this.version,
    changelog: this.changelog
  })
  .catch((err) => {
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

/**
 * doStrongback
 * Sends all build information to strongback
 */
schema.methods.doStrongback = function () {
  return Promise.each(this.builds, (build) => {
    return build.doStrongback()
  })
}

/**
 * Sends test data to flightcheck before save. Reports error on creation
 */
schema.pre('save', function (next) {
  if (!this.isNew) return next()

  return this.doFlightcheck()
  .then(() => next())
  .catch((error) => next(error))
})

export { schema }
export default db.model('cycle', schema)
