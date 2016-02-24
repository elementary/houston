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

import CycleSchema from './cycle'
import ReleaseSchema from './release'

const projectSchema = new Mongoose.Schema({
  owner: String,
  name: String,
  type: {
    type: String,
    default: 'Application'
  },

  package: {
    name: String,
    icon: String,
    price: Number
  },

  github: {
    owner: String,                // Owner of the GitHub repository
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

projectSchema.virtual('version').get(function () {
  if (this.release !== null) return this.release.version

  return null
})

projectSchema.virtual('dist-arch').get(function () {
  let results = []
  for (let dI in this.distributions) {
    for (let aI in this.architectures) {
      results.push(`${this.dists[dI]}-${this.arch[aI]}`)
    }
  }
  return results
})

const project = Mongoose.model('project', projectSchema)

export default { project, projectSchema }
