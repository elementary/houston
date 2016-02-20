/**
 * core/model/cycle.js
 * Mongoose schema for cycles
 *
 * @exports {Object} default {
 *   {Object} Cycle - Mongoose model for cycle
 *   {Object} CycleSchema - Mongoose schema for cycle model
 * }
 */

import Mongoose from 'mongoose'

import { BuildSchema } from './build'

const CycleSchema = new Mongoose.Schema({
  _repo: {
    type: String,
    validate: {
      validator: s => /.*\.git/.test(s),
      message: `{VALUE} is not a valid git repository`
    }
  },
  _tag: {
    type: String
  },

  // Determines what we do with the test results
  type: {
    type: String,
    required: true,
    enum: ['INIT', 'RELEASE']
  },
  _status: {
    type: String,
    default: 'QUEUE',
    enum: ['QUEUE', 'PRE', 'POST', 'REVIEW', 'FAIL', 'FINISH']
  },

  builds: [BuildSchema]
})

CycleSchema.methods.getProject = async function () {
  return await this.model('project').findOne({
    cycles: this._id
  })
}

CycleSchema.methods.getRelease = async function () {
  const project = await this.getProject

  for (let i in project.releases) {
    if (project.releases[i].cycles.indexOf(this._id) !== 0) {
      return project.releases[i]
    }
  }

  return null
}

CycleSchema.methods.getRepo = async function () {
  if (this._repo != null) return this._repo

  return this.getProject().then(project => project.repo)
}

CycleSchema.methods.getTag = async function () {
  if (this._tag != null) return this._tag
  const release = await this.getRelease()

  if (release != null) return release.tag

  return this.getProject().then(project => project.tag)
}

// TODO: Consolidate build status
CycleSchema.methods.getStatus = async function () {
  return 'QUEUE'
}

// Mongoose lifecycle functions
CycleSchema.post('save', async cycle => {
  console.log(cycle)
})

const Cycle = Mongoose.model('cycle', CycleSchema)

export default { Cycle, CycleSchema }
