/**
 * core/model/project.js
 * Mongoose model and schema for projects
 *
 * @exports {Object} default {
 *   {Object} project - Mongoose project model
 *   {Object} projectSchema - Mongoose schema for project model
 * }
 */

import _ from 'lodash'
import Promise from 'bluebird'
import Mongoose from 'mongoose'
import Dotize from 'dotize'
import Util from 'util'

import { ReleaseSchema } from './release'

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
    APItoken: String,             // GitHub accessToken of the latest user
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
    default: ['amd64', 'armhf']
  },

  cycles: [{
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'cycle'
  }],
  releases: [ReleaseSchema]
})

ProjectSchema.set('toJSON', { virtuals: true })

ProjectSchema.virtual('name').get(function () {
  if (this._name != null) return this._name
  if (this.package.name != null) return this.package.name
  if (this.github.name != null) return this.github.name

  return 'Unknown Project'
})

ProjectSchema.virtual('version').get(function () {
  if (this.release != null) return this.release.version

  return '0.0.0'
})

ProjectSchema.virtual('github.fullName').get(function () {
  return `${this.github.owner}/${this.github.name}`
})

ProjectSchema.virtual('dist-arch').get(function () {
  let project = this
  let results = []

  for (let dI in project.distributions) {
    for (let aI in project.architectures) {
      results.push(`${project.distributions[dI]}-${project.architectures[aI]}`)
    }
  }

  return results
})

ProjectSchema.virtual('release').get(function () {
  if (this.releases.length > 0) return this.releases[0]

  return null
})

ProjectSchema.methods.toSolid = async function () {
  let project = this.toJSON()
  project.status = await this.getStatus()

  return project
}

ProjectSchema.methods.getStatus = async function () {
  if (this.release == null) return this._status

  return await this.release.getStatus()
}

ProjectSchema.methods.upsertRelease = function (fQuery, uQuery) {
  const application = this
  const dotQuery = Dotize.convert(fQuery, 'releases')
  const notQuery = _.mapValues(dotQuery, v => ({ $ne: v }))

  return Promise.all([
    Project.findOneAndUpdate(_.extend({
      _id: application._id
    }, dotQuery), {
      'releases.$': uQuery
    }, { new: true }),
    Project.findOneAndUpdate(_.extend({
      _id: application._id
    }, notQuery), {
      $addToSet: { releases: uQuery }
    }, { new: true })
  ])
  .then(([update, create]) => {
    const project = (create != null) ? create : update
    const release = project.releases[project.releases.length - 1]

    // Execute any 'post save' release middleware
    if (create != null) {
      for (let i in saveReleaseMiddleware) {
        saveReleaseMiddleware[i](release)
      }
    }

    return release
  })
}

// Find all save middleware in ReleaseSchema for custom calls that look native
// TODO: Oh dear god, why do we need this mongoose?
// FIXME: Cleanup on aisle project
let saveReleaseMiddleware = []
const releaseMiddle = _.fromPairs(ReleaseSchema.callQueue)
if (releaseMiddle.on != null) {
  saveReleaseMiddleware = _.filter(_.map(releaseMiddle.on, (v, i) => {
    if (v === 'save') return releaseMiddle.on[i + 1]
  }), v => typeof v === 'function')
}

const Project = Mongoose.model('project', ProjectSchema)

export default { Project, ProjectSchema }
