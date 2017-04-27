/**
 * lib/database/project.js
 * Mongoose model and schema for projects
 * @flow
 *
 * @exports {Object} - project database model
 * @exports {Object} schema - project database schema
 */

import Promise from 'bluebird'
import semver from 'semver'

import * as github from 'service/github'
import db from './connection'
import Download from './download'
import releaseSchema from './release'

/**
 * @type {object} - Project database schema
 *
 * @property {String} name - project name (repo name by default)
 * @property {String} type - future use to determine types of tests to run
 * @property {String} repo - git repo code is hosted in
 * @property {String} tag - git branch to consider master (defaults to master)
 *
 * @property {Object} apphub - the object representation of the apphub file
 *
 * @property {Object} github - all data related to the project's GitHub repository
 * @property {Number} github.id - github id of project
 * @property {String} github.owner - username for github repo (can also be an organization)
 * @property {String} github.name - repository name in github
 * @property {String} github.token - token of user with contributor access to the project
 * @property {String} github.label - label to assign all houston issues to in GitHub issue tracking
 *
 * @property {Object} stripe - all data related to the project's linked stripe account
 * @property {Object} stripe.enabled - the current state of stripe payments for the project
 * @property {Object} stripe.user - User ID for who last set the oauth info
 * @property {String} stripe.id - stripe id for the account
 * @property {String} stripe.access - a private key for destructive stripe actions
 * @property {String} stripe.refresh - refresh key used for oauth when access key is stale
 * @property {String} stripe.public - a public key for client side stripe actions
 *
 * @property {String} _status - internal status of project in houston
 * @property {Error} mistake - mistake class error if any occured
 *
 * @property {Object} owner - houston user that initalizized the project in houston
 * @property {Array} releases - all releases for the project in order of version
 * @property {Array} cycles - all non release cycles for the project
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

  github: {
    id: {
      type: Number,
      unique: true,
      index: true
    },
    owner: String,
    name: String,
    private: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: 'AppHub'
    },
    installation: Number
  },

  stripe: {
    enabled: {
      type: Boolean,
      default: false
    },
    user: {
      type: db.Schema.Types.ObjectId,
      ref: 'user'
    },
    id: String,
    access: String,
    refresh: String,
    public: String
  },

  _status: {
    type: String,
    default: 'NEW',
    enum: ['NEW', 'DEFER', 'ERROR']
  },
  mistake: Object,

  owner: {
    type: db.Schema.Types.ObjectId,
    ref: 'user'
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
  const releases = this.releases.sort((a, b) => {
    const cleanA = semver.clean(a.version)
    const cleanB = semver.clean(b.version)

    if (cleanA == null) return -1
    if (cleanB == null) return 1

    return semver.compare(cleanA, cleanB)
  })

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
  delete ret['stripe']['user']
  delete ret['stripe']['id']
  delete ret['stripe']['access']
  delete ret['stripe']['refresh']
  delete ret['mistake']

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
 * @returns {Void}
 */
schema.methods.postIssue = async function (issue) {
  if (typeof issue.title !== 'string') return Promise.reject('Issue needs a title')
  if (typeof issue.body !== 'string') return Promise.reject('Issue needs a body')

  const gh = this.github
  const token = await github.generateToken(gh.installation)

  await github.postLabel(gh.owner, gh.name, token, gh.label)
  return github.postIssue(gh.owner, gh.name, token, Object.assign(issue, {
    label: gh.label
  }))
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
    throw new Error('Unable to cycle a project without a release')
  }

  if (type === 'RELEASE') return this.release.latest.createCycle(type)

  const cycle = await db.model('cycle').create({
    project: this._id,
    installation: this.github.installation,
    repo: this.repo,
    tag: this.tag,
    name: this.name,
    version: this.release.latest.version,
    type,
    changelog: await this.release.latest.createChangelog(),
    stripe: this.stripe.public
  })

  await this.update({ $addToSet: { 'cycles': cycle._id } })

  return cycle
}

/**
 * findDownloadTotal
 * Returns the total amount of downloads for the Project
 *
 * @async
 * @return {Number} - Total amount of downloads for the Project
 */
schema.methods.findDownloadTotal = async function (): Promise<number> {
  const releaseIDs = this.releases.map((release) => release._id)

  const promises = []
  releaseIDs.forEach((id) => promises.push(Download.findTotal(id)))
  const totals = await Promise.all(promises)

  return totals.reduce((a, b) => a + b)
}

/**
 * Removes all cycles when deleteing a project
 *
 * @param {Object} this - Document getting removed
 * @param {Function} next - Calls next middleware
 * @returns {void}
 */
schema.pre('remove', async function (next) {
  const cycleID = []

  cycleID.push(...this.cycles)
  this.releases.forEach((release) => cycleID.push(...release.cycles))

  const cycles = await db.model('cycle').find({
    _id: { $in: cycleID }
  })

  await Promise.each(cycles, (cycle) => cycle.remove())

  next()
})

export default db.model('project', schema)
