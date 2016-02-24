/**
 * core/model/cycle.js
 * Mongoose schema for cycles
 *
 * @exports {Object} default {
 *   {Object} cycleSchema - Mongoose schema for cycle model
 * }
 */

import Mongoose from 'mongoose'
import Promise from 'bluebird'

import BuildSchema from './build'

const cycleSchema = new Mongoose.Schema({
  release: String,

  repo: {
    type: String,
    required: true,
    validate: {
      validator: s => s.endsWidth('.git'),
      message: `{VALUE} is not a valid git repository`
    }
  },

  // Determines if we save, publish, and create issues
  type: {
    type: String,
    enum: ['ORPHAN', 'RELEASE']
  },
  status: {
    type: String,
    default: 'QUEUED',
    enum: ['QUEUE', 'PRE', 'BUILD', 'POST', 'FAIL', 'FINISH']
  },

  build: [BuildSchema]
})

cycleSchema.virtual('application').get(function () {
  return this.ownerDocument()
})

cycleSchema.virtual('type').get(function () {
  if (this.release != null) return 'RELEASE'

  return this.type
})

cycleSchema.virtual('version').get(function () {
  if (this.type === 'release') return this.release.version
})

cycleSchema.virtual('tag').get(function () {
  if (this.type === 'release') return this.release.tag
})

cycleSchema.virtual('status').get(function () {
  let finish = true
  let fail = false
  let build = false

  // Condances builds to a singular status (all FINISH, any FAIL, any BUILD)
  for (let build in this.build) {
    if (build.status !== 'FINISH') {
      finish = false
    } else if (build.status === 'FAIL') {
      fail = true
    } else if (build.status === 'BUILD') {
      build = true
    }
  }

  if (finish) {
    return 'FINISH'
  } else if (fail) {
    return 'FAIL'
  } else if (build) {
    return 'BUILD'
  } else {
    return this._status
  }
})

// Mongoose lifecycle functions
cycleSchema.pre('save', function (next) {
  this.wasNew = this.isNew
  next()
})

cycleSchema.post('save', function (cycle, next) {
  if (cycle.wasNew) {
    let builds = []

    for (let arch in cycle.application.archs) {
      for (let dist in cycle.application.dists) {
        builds.push(this.update({ $push: { arch, dist } }))
      }
    }

    return Promise.all(builds)
    .then(() => next)
  } else {
    return next()
  }
})

export default { cycleSchema }
