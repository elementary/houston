/**
 * core/model/project.js
 * Mongoose model and schema for projects
 *
 * @exports {Object} default {
 *   {Object} project - Mongoose project model
 *   {Object} projectSchema - Mongoose schema for project model
 * }
 */

import Mongoose from 'mongoose'

import { CycleSchema } from './cycle'
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

  _status: {
    type: String,
    default: 'NEW',
    enum: ['NEW', 'STANDBY', 'PRE', 'BUILD', 'POST', 'FAIL', 'FINISH']
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

  cycles: [CycleSchema],
  releases: [ReleaseSchema]
})

ProjectSchema.virtual('name').get(function () {
  if (this._name != null) return this._name
  if (this.package.name != null) return this.package.name
  if (this.github.name != null) return this.github.name

  return 'Unknown Project'
})

ProjectSchema.virtual('version').get(function () {
  if (this.release != null) return this.release.version

  return null
})

ProjectSchema.virtual('status')
.get(function () {
  if (this.release != null) return this.release.status

  return this._status
})
.set(function (_status) {
  if (_status !== 'STANDBY') {
    return Promise.reject("Unable to set status to anything other than 'STANDBY'")
  }

  return this.update({ _status }, { new: true })
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
  if (this.releases.length > 0) return this.releases[this.releases.length - 1]

  return null
})

const Project = Mongoose.model('project', ProjectSchema)

export default { Project, ProjectSchema }
