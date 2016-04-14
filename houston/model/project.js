/**
 * houston/model/project.js
 * Mongoose model and schema for projects
 *
 * @exports {Object} - project database model
 * @exports {Object} schema - project database schema
 */

import semver from 'semver'

import db from '~/lib/database'
import render from '~/lib/render'
import * as github from '~/houston/service/github'

export const schema = new db.Schema({
  _name: String,
  owner: {
    type: db.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  type: {
    type: String,
    default: 'Application'
  },

  package: {
    name: String,
    icon: String,
    price: Number
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

  _status: {
    type: String,
    default: 'NEW',
    enum: ['NEW', 'INIT']
  },

  github: {
    id: {                         // GitHub API id
      type: Number,
      unique: true
    },
    owner: String,                // Owner of the GitHub repository login
    name: String,                 // Github Repository name
    token: String,                // GitHub accessToken of the latest user
    label: {                      // Github issue label
      type: String,
      default: 'AppHub'
    }
  },

  distributions: {                // Distribution for Builds
    type: [String],
    default: ['xenial']
  },
  architectures: {                // Architect for Builds
    type: [String],
    default: ['amd64']
  },

  cycles: [{
    type: db.Schema.Types.ObjectId,
    ref: 'cycle'
  }],
  releases: [{
    type: db.Schema.Types.ObjectId,
    ref: 'release'
  }]
})

schema.set('toJSON', { virtuals: true })

schema.virtual('name').get(function () {
  if (this._name != null) return this._name
  if (this.package.name != null) return this.package.name
  if (this.github.name != null) return this.github.name

  return 'Unknown Project'
})

schema.virtual('github.fullName').get(function () {
  return `${this.github.owner}/${this.github.name}`
})

schema.methods.getStatus = function () {
  if (this.releases.length < 1) return Promise.resolve(this._status)

  return this.model('cycle')
  .findOne({
    _id: {$in: this.cycles},
    type: 'RELEASE'
  })
  .then((cycle) => {
    if (cycle != null) return cycle.getStatus()

    return Promise.resolve('STANDBY')
  })
}

schema.methods.getVersion = function () {
  if (this.releases.length < 1) return Promise.resolve('0.0.0')

  return this.model('release')
  .findOne({_id: {$in: this.releases}})
  .sort({'github.date': -1})
  .then((release) => release.version)
}

schema.methods.postLabel = function () {
  return github.sendLabel(this.github.owner, this.github.name, this.github.token, this.github.label)
}

schema.methods.postIssue = function (issue) {
  if (typeof issue.title !== 'string') return Promise.reject('Issue needs a title')
  if (typeof issue.body !== 'string') return Promise.reject('Issue needs a body')

  return github.sendIssue(this.github.owner, this.github.name, this.github.token, issue, this.github.label)
}

schema.methods.generateChangelog = function (dist, arch) {
  return this.model('release')
  .find({_id: {$in: this.releases}})
  .then((releases) => releases.sort((a, b) => semver.rcompare(a.version, b.version)))
  .map((release) => {
    return render('houston/views/changelog.nun', {
      dist,
      arch,
      release,
      project: this
    }, false).body
  })
  .then((releases) => releases.join('\n\n'))
}

export default db.model('project', schema)
