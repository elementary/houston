/**
 * houston/model/cycle.js
 * Mongoose schema for cycles
 *
 * @exports {Object} - cycle database model
 * @exports {Object} schema - cycle database schema
 */

import semver from 'semver'

import * as atc from 'lib/atc'
import db from 'lib/database'

const sender = new atc.Sender('cycle')

/**
 * Stores cycle information. 1 cycle = 1 project version being built
 *
 * @param {String} repo - git repo of cycle (git@github.com:elementary/vocal.git)
 * @param {Number} installation - github installation number
 * @param {String} tag - git tag to build (master)
 * @param {String} name - project name (com.github.vocalapp.vocal)
 * @param {String} version - semver version of cycle (1.0.0)
 * @param {String} type - cycle type (RELEASE = go all the way)
 * @param {String} changelog
 * @param {Array} packages - array of aptly package keys
 * @param {String} _status - current status of cycle without influence of builds
 * @param {Object} mistake - mistake class error if any occured
 */
const schema = new db.Schema({
  project: {
    type: db.Schema.Types.ObjectId,
    ref: 'project',
    required: true
  },
  installation: {
    type: Number,
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
    index: true,
    validate: {
      validator: (s) => /(.+)\.(.+)\.(.+)/.test(s),
      message: '{VALUE} is not a valid reverse domain name notation'
    }
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
    enum: ['RELEASE']
  },

  changelog: {
    type: Array,
    required: true
  },
  packages: Array,

  _status: {
    type: String,
    default: 'QUEUE',
    enum: ['QUEUE', 'RUN', 'REVIEW', 'FINISH', 'FAIL', 'ERROR']
  },
  mistake: Object
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

  ret['id'] = ret['_id']
  ret['status'] = status

  delete ret['_id']
  delete ret['__v']
  delete ret['installation'] // security reasons
  delete ret['_status']
  delete ret['repo'] // It might have access token for cloning
  delete ret['mistake'] // Don't leak private code things

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
  return this._status
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
    return Promise.reject('Unable to set status past "RUN" on "INIT" type cycles')
  }
  if (this.type === 'ORPHAN' && (!final || options.indexOf(status) >= 3)) {
    return Promise.reject('Unable to set status past "REVIEW" on "ORPHAN" type cycles')
  }

  return this.update({ _status: status })
  .then((data) => {
    if (data.nModified === 1) this._status = status

    return data
  })
}

/**
 * doFlightcheck
 * Sets all build information to flightcheck for pre testing
 *
 * @throws {Mistake} - if an error occured communicating with flightcheck
 * @returns {Void}
 */
schema.methods.doFlightcheck = async function () {
  return sender.add('release', {
    id: this._id,
    installation: this.installation,
    repo: this.repo,
    tag: this.tag,
    name: this.name,
    version: this.version,
    changelog: this.changelog.reverse()
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
