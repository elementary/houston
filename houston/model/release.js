/**
 * houston/model/release.js
 * Mongoose schema for cycles
 *
 * @exports {Object} - Houston database schema
 */

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
const schema = new db.Schema({
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
 * cycles
 * A simple virtual to save time
 *
 * @returns {Object} cycles - {
 *   {Object} latest - latest cycle
 *   {Object} oldest - oldest cycle
 * }
 */
schema.virtual('cycle').get(function () {
  const Cycle = db.model('cycle')

  return {
    latest: Cycle.findById(this.cycles[this.cycles.length - 1]).exec(),
    oldest: Cycle.findById(this.cycles[0]).exec()
  }
})

/**
 * update
 * updates nested release object
 * TODO: add support for $push updates
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
schema.methods.getStatus = async function () {
  if (this._status !== 'DEFER') {
    return Promise.resolve(this._status)
  }

  const latest = await this.cycle.latest
  return latest.getStatus()
}

/**
 * setStatus
 * Sets status as promised
 *
 * @param {String} status - new status of release
 * @returns {Object} mongoose update promise
 */
schema.methods.setStatus = async function (status) {
  if (this._status === 'DEFER') {
    const cycle = await db.model('cycle').findById(this.cycles[this.cycles.length - 1])

    return cycle.setStatus(status)
  }

  return this.update({ _status: status })
  .then((data) => {
    if (data.nModified === 1) this._status = status
    return data
  })
}

/**
 * createCycle
 * Creates a new cycle
 *
 * @param {String} type - type of cycle to create
 * @returns {Object} - database object for new cycle
 */
schema.methods.createCycle = async function (type) {
  const builds = []
  this.project.dists.forEach((dist) => {
    this.project.archs.forEach((arch) => {
      builds.push({dist, arch})
    })
  })

  return db.model('cycle').create({
    project: this.project._id,
    repo: this.project.repo,
    tag: this.github.tag,
    name: this.project.package.name,
    version: this.version,
    type,
    changelog: await this.createChangelog(),
    builds
  })
  .then((cycle) => {
    const updates = {
      $addToSet: {
        'releases.$.cycles': cycle._id
      }
    }

    if (this._status !== 'DEFER') {
      updates['$set'] = {
        'releases.$._status': 'DEFER'
      }
    }

    // TODO: replace this with `this.update()` when $push support is added
    return db.model('project').update({
      _id: this.project._id,
      'releases._id': this._id
    }, updates)
    .then(() => cycle)
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
    return semver.lte(release.version, this.version)
  })

  return uptoRelease.map((release) => {
    return {
      author: release.github.author,
      changelog: release.changelog,
      date: release.github.date,
      version: release.version
    }
  })
}

/**
 * Sets default properties if they are not already set
 */
schema.pre('save', function (next) {
  if (this.version == null) {
    this.version.set(semver.clean(this.github.tag, true))
  }

  next()
})

export default schema
