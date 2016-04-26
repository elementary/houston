/**
 * houston/model/release.js
 * Mongoose schema for cycles
 *
 * @exports {Object} - Houston database model
 * @exports {Object} schema - Houston database schema
 */

import _ from 'lodash'
import semver from 'semver'

import * as dotNotation from '~/lib/helpers/dotNotation'
import db from '~/lib/database'

/**
 * @param {String} version -semver version of release
 * @param {Array} changelog - list of changes in this release
 * @param {Object} github - {
 *   {Number} id - github release id
 *   {String} author - username of github author
 *   {Date} date - date of release on github
 *   {String} tag - github tag used for branching and version generation
 * }
 * @param {Object} date - {
 *   {Date} released - date released
 *   {Date} cycled - date of latest cycle creation
 *   {Date} published - date packages were put into stable repository
 * }
 * @param {String} _status - current status of release
 * @param {Error} mistake - mistake class error if any occured
 * @param {Array} cycles - all cycles building for this release
 */
export const schema = new db.Schema({
  version: {
    type: String,
    required: true
  },
  changelog: [{
    type: String,
    required: true
  }],

  github: {
    id: {
      type: Number,
      required: true
    },
    author: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    tag: {
      type: String,
      required: true
    }
  },

  date: {
    released: Date,
    cycled: Date,
    published: Date
  },

  _status: {
    type: String,
    default: 'STANDBY',
    enum: ['STANDBY', 'DEFER', 'ERROR']
  },
  mistake: Object,

  cycles: [{
    type: db.Schema.Types.ObjectId,
    ref: 'cycle'
  }]
})

/**
 * project
 * A project virtual for sanity
 *
 * @returns {Object} parent project of this release
 */
schema.virtual('project').get(function () {
  return this.ownerDocument()
})

/**
 * update
 * updates nested release object
 *
 * @param {Object} obj - object of updated values
 * @param {Object} opt - options to pass into query
 * @return {Object} - mongoose query of update
 */
schema.methods.update = function (obj, opt) {
  return db.model('project').update({
    _id: this.project._id,
    'releases._id': this._id
  }, dotNotation.toDot(obj, '.', 'releases.$'), opt)
}

/**
 * getStatus
 * Returns status as promised
 *
 * @returns {String} status of release
 */
schema.methods.getStatus = function () {
  if (this._status !== 'DEFER') {
    return Promise.resolve(this._status)
  }

  return db.model('project').findOne({
    'releases._id': this._id
  })
  .populate('releases cycles')
  .then((project) => {
    const release = project.releases(this._id)
    return release.cycles[0].getStatus()
  })
}

/**
 * setStatus
 * Sets status as promised
 *
 * @param {String} status - new status of release
 * @returns {Object} mongoose query of update
 */
schema.methods.setStatus = function (status) {
  if (this._status !== 'STANDBY' || status !== 'DEFER') {
    return Promise.reject('Unable to set status on a release currently cycled')
  }

  return this.update({ _status: status }).exec()
}

/**
 * createCycle
 * Creates a new cycle
 *
 * @returns {Object} - database object for new cycle
 */
schema.methods.createCycle = async function (type) {
  const builds = _.zip(this.project.dists, this.project.archs, (dist, arch) => {
    return { dist, arch }
  })

  return db.model('cycle').create({
    repo: this.project.repo,
    tag: this.github.tag,
    name: this.project.name,
    version: this.version,
    type,
    changelog: await this.createChangelog(),
    builds
  })
}

/**
 * createChangelog
 * Creates a changelog section
 * TODO: move changelog generation over to strongback as it's the only thing that uses it
 *
 * @returns {Array} - an array of all releases changelog up to this release
 */
schema.methods.createChangelog = function () {
  const uptoRelease = this.project.releases.filter((release) => {
    return semver.lte(this.version, release.version)
  })

  return uptoRelease.map((release) => release.changelog)
}

/**
 * Sets default properties if they are not already set
 */
schema.pre('save', function (next) {
  if (this.version == null) {
    this.version.set(semver.clean(this.github.tag, true))
  }

  if (this.date.released == null) {
    this.date.set(this.github.date.toUTCString().replace('GMT', '+0000'))
  }

  next()
})

export default db.model('release', schema)
