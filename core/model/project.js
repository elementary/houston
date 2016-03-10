/**
 * core/model/project.js
 * Mongoose model and schema for projects
 *
 * @exports {Object} default {
 *   {Object} project - Mongoose project model
 *   {Object} projectSchema - Mongoose schema for project model
 * }
 */

import Promise from 'bluebird'
import Nunjucks from 'nunjucks'
import Semver from 'semver'

import { Db as Mongoose } from '~/app'

// TODO: abstract services out of mondels
import { SendLabel, SendIssue } from '~/core/service/github'

const ProjectSchema = new Mongoose.Schema({
  _name: String,
  owner: {
    type: Mongoose.Schema.Types.ObjectId,
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
      validator: s => /.*\.git/.test(s),
      message: `{VALUE} is not a valid git repository`
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
    default: ['sid', 'xenial']
  },
  architectures: {                // Architect for Builds
    type: [String],
    default: ['amd64']
  },

  cycles: [{
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'cycle'
  }],
  releases: [{
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'release'
  }]
})

ProjectSchema.set('toJSON', { virtuals: true })

ProjectSchema.virtual('name').get(function () {
  if (this._name != null) return this._name
  if (this.package.name != null) return this.package.name
  if (this.github.name != null) return this.github.name

  return 'Unknown Project'
})

ProjectSchema.virtual('github.fullName').get(function () {
  return `${this.github.owner}/${this.github.name}`
})

ProjectSchema.methods.getStatus = function () {
  if (this.releases.length < 1) return Promise.resolve(this._status)

  return this.model('cycle')
  .findOne({
    _id: {$in: this.cycles},
    type: 'RELEASE'
  })
  .then(cycle => {
    if (cycle != null) return cycle.getStatus()

    return Promise.resolve('STANDBY')
  })
}

ProjectSchema.methods.getVersion = function () {
  if (this.releases.length < 1) return Promise.resolve('0.0.0')

  return this.model('release')
  .findOne({_id: {$in: this.releases}})
  .sort({'github.date': -1})
  .then(release => release.version)
}

ProjectSchema.methods.postLabel = function () {
  return SendLabel(this)
}

ProjectSchema.methods.postIssue = function (issue) {
  if (typeof issue.title !== 'string') return Promise.reject('Issue needs a title')
  if (typeof issue.body !== 'string') return Promise.reject('Issue needs a body')

  return SendIssue(issue, this)
}

ProjectSchema.methods.generateChangelog = function (dist, arch) {
  return this.model('release')
  .find({_id: {$in: this.releases}})
  .then(releases => {
    releases.sort((a, b) => Semver.rcompare(a.version, b.version))

    return releases.map(release => {
      return Nunjucks.render(`views/changelog.nun`, {
        dist,
        arch,
        release,
        project: this
      })
    })
  })
  .then(releases => releases.join('\n'))
}

const Project = Mongoose.model('project', ProjectSchema)

export default { Project, ProjectSchema }
