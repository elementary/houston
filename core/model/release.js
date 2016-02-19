/**
 * core/model/release.js
 * Mongoose schema for cycles
 *
 * @exports {Object} default {
 *   {Object} releaseSchema - Mongoose schema for release model
 * }
 */

import Mongoose from 'mongoose'
import Semver from 'semver'

import { Log } from '~/app'
import CycleSchema from './cycle'

const ReleaseSchema = new Mongoose.Schema({
  github: {
    id: Number,              // Id for Github API
    author: String,          // Github user login
    date: Date,              // Github publish date
    tag: String              // Github uncleaned tag (v4.2.3)
  },

  repo: {
    type: String,
    required: true,
    validate: {
      validator: s => s.endsWidth('.git'),
      message: `{VALUE} is not a valid git repository`
    }
  },

  _status: {
    type: String,
    default: 'NEW',
    enum: ['NEW', 'QUEUE', 'PRE', 'BUILD', 'POST', 'FAIL', 'FINISH']
  },

  cycles: [CycleSchema]
})

ReleaseSchema.virtual('project').get(function () {
  return this.ownerDocument()
})

ReleaseSchema.virtual('version').get(function () {
  return Semver.clean(this.github.tag, true)
})

ReleaseSchema.virtual('status')
.get(function () {
  if (this.cycle != null) return this.cycle.status

  return 'NEW'
})
.set(function (_status) {
  return this.update({ _status }, { new: true })
})

ReleaseSchema.virtual('cycle').get(function () {
  if (this.cycles.length > 0) return this.cycles[this.cycles.length - 1]

  return null
})

// TODO: create an update function for releases

/**
 * Creates a new cycle for release
 *
 * @return {Object} updated release object
 */
// FIXME: this probably doesn't work
ReleaseSchema.methods.createCycle = async function () {
  let release = this

  const cycle = await this.project.cycles.create({
    project: release._id,
    repo: release.repo
  })

  if (cycle == null) return Promise.reject('Unable to create cycle')

  return release.update({ $push: { cycles: cycle._id } })
}

// Mongoose lifecycle functions
ReleaseSchema.post('delete', doc => {
  let cycles = []

  for (let i in doc.cycles) {
    cycles.push(doc.cycles[i].remove())
  }

  Promise.all(cycles)
  .catch(err => {
    Log.warn(`Error while removing all cycles from ${doc.application.name}#${doc.version}`)
    Log.error(err)
  })
})

export default { ReleaseSchema }
