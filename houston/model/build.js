/**
 * houston/model/build.js
 * Mongoose schema for builds
 *
 * @exports {Object} - build database model
 * @exports {Object} schema - build database schema
 */

import atc from '~/houston/service/atc'
import db from '~/lib/database'
import grid from '~/lib/grid'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'
import * as dotNotation from '~/lib/helpers/dotNotation'

export const schema = new db.Schema({
  dist: {
    type: String,
    required: true
  },
  arch: {
    type: String,
    required: true
  },

  status: {
    type: String,
    default: 'QUEUE',
    enum: ['QUEUE', 'BUILD', 'FAIL', 'FINISH', 'ERROR']
  },
  mistake: db.Schema.Types.Mixed,

  files: Object,

  started: {
    type: Date,
    default: new Date()
  },
  finished: Date
})

// Used internally for sanity
schema.virtual('cycle').get(function () {
  return this.ownerDocument()
})

/**
 * file
 * grabs a file from the database
 *
 * @param {String} name - file name
 * @returns {Object} grid file object
 */
schema.virtual('file').get(function (name) {
  if (this.files[name] == null) {
    return Promise.resolve(null)
  }

  return grid.get(this.files[name])
})

/**
 * file
 * creates a file from the database
 *
 * @param {Buffer} file - buffer of file to save
 * @param {Object} metadata - any other data to save with file
 * @return {ObjectId} - file id
 */
schema.virtual('file').set(function (file, metadata) {
  return grid.create(file, metadata)
  .then((id) => {
    return this.update({
      [`files.${file}`]: id
    })
    .then(() => id)
  })
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

// sets wasNew for post middleware where isNew property does not exist
schema.pre('save', function (next) {
  this.wasNew = this.isNew
  next()
})

// Automaticly sends build to strongback
schema.post('save', (doc) => {
  if (!doc.wasNew) return

  atc.send('strongback', 'build:start', {
    arch: doc.arch,
    changelog: doc.cycle.changelog,
    dist: doc.dist,
    name: doc.cycle.name,
    repo: doc.cycle.repo,
    tag: doc.cycle.tag,
    version: doc.cycle.version
  })
  .then(() => {
    log.debug(`Building ${doc.cycle.tag} for ${doc.arch} on ${doc.dist}`)
  })
  .catch((err) => {
    log.warn(`Automated building of ${doc.cycle.tag} has failed`)

    doc.update({
      status: 'ERROR',
      mistake: new Mistake(500, 'Automated building failed', err)
    })
    .exec()
  })
})

export default db.model('build', schema)
