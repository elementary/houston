/**
 * houston/model/project.js
 * Mongoose model and schema for projects
 *
 * @exports {Object} - project database model
 * @exports {Object} schema - project database schema
 */

import crypto from 'crypto'
import semver from 'semver'

import * as github from '~/houston/service/github'
import db from '~/lib/database'
import releaseSchema from './release'

/**
 * @param {String} name - project name (repo name by default)
 * @param {String} type - future use to determine types of tests to run
 * @param {String} repo - git repo code is hosted in
 * @param {String} tag - git branch to consider master (defaults to master)
 * @param {Object} apphub - the object representation of the apphub file
 * @param {Number} downloads - the number of downloads the current project has
 * @param {Array} dists - list of disributions to build for
 * @param {Array} archs - list of architectures to build for
 * @param {Object} github - {
 *   {Number} id - github id of project
 *   {String} owner - username for github repo (can also be an organization)
 *   {String} name - repository name in github
 *   {String} token - token of user with contributor access to the project
 *   {String} label - label to assign all houston issues to in GitHub issue tracking
 * }
 * @param {String} _status - internal status of project in houston
 * @param {Error} mistake - mistake class error if any occured
 * @param {Object} owner - houston user that initalizized the project in houston
 * @param {Array} releases - all releases for the project in order of version
 * @param {Array} cycles - all non release cycles for the project
 */
export const schema = new db.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: (s) => /(.+)\.(.+)\.(.+)/.test(s),
      message: '{VALUE} is not a valid reverse domain name notation'
    }
  },
  type: {
    type: String,
    default: 'Application'
  },

  repo: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (s) => /.*\.git/.test(s),
      message: '{VALUE} is not a valid git repository'
    }
  },
  tag: {
    type: String,
    default: 'master'
  },

  apphub: {
    type: Object,
    default: {}
  },
  downloads: Number,

  dists: {
    type: [String],
    default: ['xenial']
  },
  archs: {
    type: [String],
    default: ['amd64']
  },

  github: {
    id: {
      type: Number,
      unique: true,
      index: true
    },
    owner: String,
    name: String,
    private: Boolean,
    token: String,
    label: {
      type: String,
      default: 'AppHub'
    },
    hook: Number,
    secret: {
      type: String,
      default: () => {
        return crypto.randomBytes(20).toString('hex')
      }
    }
  },

  _status: {
    type: String,
    default: 'NEW',
    enum: ['NEW', 'INIT', 'DEFER', 'ERROR']
  },
  mistake: Object,

  owner: {
    type: db.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  releases: [releaseSchema],
  cycles: [{
    type: db.Schema.Types.ObjectId,
    ref: 'cycle'
  }]
})

/**
 * github.fullName
 * A simple virtual to save time and space
 *
 * @returns {String} github name in owner/repo format
 */
schema.virtual('github.fullName').get(function () {
  return `${this.github.owner}/${this.github.name}`
})

/**
 * release
 * A simple virtual to save time
 *
 * @returns {Object} release - {
 *   {Object} latest - latest release
 *   {Object} oldest - oldest release
 * }
 */
schema.virtual('release').get(function () {
  const releases = this.releases.sort((a, b) => semver.compare(a.version, b.version))

  return {
    latest: releases[releases.length - 1],
    oldest: releases[0]
  }
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
 * toNormal
 * Async notmalization function for objects
 *
 * @returns {Object} - a promise of a better object
 */
schema.methods.toNormal = async function () {
  const ret = this.toObject()
  const status = await this.getStatus()
  const releases = await Promise.map(this.releases, (release) => release.toObject())

  ret['id'] = ret['_id']
  ret['status'] = status
  ret['releases'] = releases

  delete ret['_id']
  delete ret['__v']
  delete ret['_status']
  delete ret['package']['icon']
  delete ret['github']['token']
  delete ret['github']['secret']

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
 * @returns {String} status of release
 */
schema.methods.getStatus = function () {
  if (this._status !== 'DEFER') {
    return Promise.resolve(this._status)
  }

  return this.release.latest.getStatus()
}

/**
 * setStatus
 * Sets status as promised
 *
 * @param {String} status - new status of release
 * @returns {Object} mongoose update promise
 */
schema.methods.setStatus = function (status) {
  if (this._status === 'DEFER') {
    return this.release.latest.setStatus(status)
  }

  return this.update({ _status: status })
  .then((data) => {
    if (data.nModified === 1) this._status = status
    return data
  })
}

/**
 * postIssue
 * Creates issue in GitHub
 *
 * @param {Object} issue - {
 *   {String} title - issue title
 *   {String} body - issue body
 * }
 */
schema.methods.postIssue = function (issue) {
  if (typeof issue.title !== 'string') return Promise.reject('Issue needs a title')
  if (typeof issue.body !== 'string') return Promise.reject('Issue needs a body')

  return github.sendLabel(this.github.owner, this.github.name, this.github.token, this.github.label)
  .then(() => github.sendIssue(this.github.owner, this.github.name, this.github.token, issue, this.github.label))
}

/**
 * createCycle
 * Creates a new cycle
 *
 * @param {String} type - type of cycle to create
 * @returns {Object} - database object for new cycle
 */
schema.methods.createCycle = async function (type) {
  if (this._status === 'NEW') {
    return Promise.reject('Unable to cycle an uninitalized project')
  }

  if (type === 'RELEASE') {
    return this.release.latest.createCycle(type)
    .then((data) => {
      if (this._status === 'DEFER') return data

      return this.update({ _status: 'DEFER' })
      .then(() => data)
    })
  }

  const builds = []
  this.dists.forEach((dist) => {
    this.archs.forEach((arch) => {
      builds.push({dist, arch})
    })
  })

  return db.model('cycle').create({
    project: this._id,
    auth: this.github.token,
    repo: this.repo,
    tag: this.tag,
    name: this.name,
    version: this.release.latest.version,
    type,
    changelog: await this.release.latest.createChangelog(),
    builds
  })
  .then((cycle) => {
    // TODO: replace this with `this.update()` when $push support is added
    return this.update({
      $addToSet: {
        'cycles': cycle._id
      }
    })
    .then(() => cycle)
  })
}

export default db.model('project', schema)
