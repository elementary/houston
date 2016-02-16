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

const releaseSchema = new Mongoose.Schema({
  version: String,

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

  status: {
    type: String,
    default: 'QUEUED',
    enum: ['QUEUE', 'PRE', 'BUILD', 'POST', 'FAIL', 'FINISH']
  },

  cycles: [CycleSchema]
})

releaseSchema.virtual('application').get(function () {
  return this.ownerDocument()
})

releaseSchema.virtual('version').get(function () {
  return Semver.clean(this.github.tag, true)
})

// Mongoose lifecycle functions
releaseSchema.post('delete', doc => {
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

export default { releaseSchema }
