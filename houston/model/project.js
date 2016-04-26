/**
 * houston/model/project.js
 * Mongoose model and schema for projects
 *
 * @exports {Object} - project database model
 * @exports {Object} schema - project database schema
 */

import semver from 'semver'

import * as github from '~/houston/service/github'
import db from '~/lib/database'
import releaseSchema from './release'

/**
 * @param {String} name - project name (repo name by default)
 * @param {String} type - future use to determine types of tests to run
 * @param {String} repo - git repo code is hosted in
 * @param {String} tag - git branch to consider master (defaults to master)
 * @param {Object} package - {
 *   {String} name - name of generated package and package in repository
 *   {String} icon - svg icon for the package
 *   {Number} price - price for package in appcenter
 *  }
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
    required: true
  },
  type: {
    type: String,
    default: 'Application'
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
    default: 'master'
  },

  package: {
    name: {
      type: String,
      unique: true
    },
    icon: String,
    price: Number
  },

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
      unique: true
    },
    owner: String,
    name: String,
    token: String,
    label: {
      type: String,
      default: 'AppHub'
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
  releases: [{
    type: db.Schema.Types.ObjectId,
    ref: 'release'
  }],
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
 * release.latest
 * A simple virtual to save time
 *
 * @returns {Object} - latest release
 */
schema.virtual('release.latest').get(function () {
  return this.releases[0]
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
 * @returns {Object} mongoose query of update
 */
schema.methods.setStatus = function (status) {
  if (status === 'DEFER') {
    return Promise.reject('Unable to set status on a released project')
  }

  return this.update({ _status: status }).exec()
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

  github.sendLabel(this.github.owner, this.github.name, this.github.token, this.github.label)
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
  if (type === 'release') {
    return this.release.latest.createCycle(type)
  }

  const builds = _.zip(this.dists, this.archs, (dist, arch) => {
    return { dist, arch }
  })

  return db.model('cycle').create({
    repo: this.repo,
    tag: this.tag,
    name: this.package.name,
    version: this.release.latest.version,
    type,
    changelog: await this.release.latest.createChangelog(),
    builds
  })
}

export default db.model('project', schema)
