/**
 * houston/model/build.js
 * Mongoose schema for builds
 *
 * @exports {Object} - build database schema
 */

import * as dotNotation from '~/lib/helpers/dotNotation'
import * as grid from '~/lib/grid'
import atc from '~/houston/service/atc'
import db from '~/lib/database'
import Mistake from '~/lib/mistake'

/**
 * Stores individual build information. 1 build = 1 package = 1 log
 *
 * @param {String} dist - distribution to build on (xenial)
 * @param {String} arch - architecture to build on (amd64)
 * @param {Object} files - key storage for any file stored
 * @param {String} package - aptly package id
 * @param {String} _status - current status of build in strongback
 * @param {Error} mistake - mistake class error if any occured
 * @param {Date} started - when the build was first created in the database
 * @param {Date} finished - when the build finished with strongback
 */
const schema = new db.Schema({
  dist: {
    type: String,
    required: true
  },
  arch: {
    type: String,
    required: true
  },

  files: Object,
  package: String,

  _status: {
    type: String,
    default: 'HOLD',
    enum: ['HOLD', 'QUEUE', 'BUILD', 'FINISH', 'FAIL', 'ERROR']
  },
  mistake: Object,

  started: {
    type: Date,
    default: new Date()
  },
  finished: Date
})

/**
 * cycle
 * A cycle virtual for sanity
 *
 * @returns {Object} parent cycle of this build
 */
schema.virtual('cycle').get(function () {
  return this.ownerDocument()
})

/**
 * update
 * updates nested build object
 *
 * @param {Object} obj - object of updated values
 * @param {Object} opt - options to pass into query
 * @return {Object} - mongoose query of update
 */
schema.methods.update = function (obj, opt) {
  return db.model('cycle').update({
    _id: this.cycle._id,
    'builds._id': this._id
  }, dotNotation.toDot(obj, '.', 'builds.$'), opt)
}

/**
 * getStatus
 * Returns status as promised
 *
 * @returns {String} status of build
 */
schema.methods.getStatus = function () {
  return Promise.resolve(this._status)
}

/**
 * setStatus
 * Sets status as promised
 *
 * @param {String} status - new status of build
 * @returns {Object} mongoose update promise
 */
schema.methods.setStatus = function (status) {
  return this.update({ _status: status })
  .then((data) => {
    if (data.nModified === 1) this._status = status
    return data
  })
}

/**
 * getFile
 * grabs a file from the database
 *
 * @param {String} name - file name
 * @returns {Object} grid file object
 */
schema.methods.getFile = function (name) {
  if (this.files[name] == null) {
    return Promise.resolve(null)
  }

  return grid.get(this.files[name])
}

/**
 * setFile
 * creates a file from the database
 *
 * @param {String} name - name of file to save
 * @param {Buffer} file - buffer of file to save
 * @param {Object} metadata - any other data to save with file
 * @return {ObjectId} - file id
 */
schema.methods.setFile = function (name, file, metadata) {
  return grid.create(file, metadata)
  .then((id) => {
    return this.update({
      [`files.${name}`]: id
    })
    .then(() => id)
  })
}

/**
 * doStrongback
 * Sends build information to strongback
 */
schema.methods.doStrongback = function () {
  return atc.send('strongback', 'build:start', {
    arch: this.arch,
    changelog: this.cycle.changelog,
    dist: this.dist,
    name: this.cycle.name,
    repo: this.cycle.repo,
    tag: this.cycle.tag,
    version: this.cycle.version
  })
  .then(() => this.setStatus('QUEUE'))
  .catch((err) => {
    const mistake = new Mistake(500, 'Automated building failed', err)

    return this.update({
      _status: 'ERROR',
      mistake
    })
    .then(() => {
      throw mistake
    })
  })
}

export default schema
