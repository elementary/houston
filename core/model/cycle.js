/**
 * core/model/cycle.js
 * Mongoose schema for cycles
 *
 * @exports {Object} default {
 *   {Object} cycleSchema - Mongoose schema for cycle model
 * }
 */

import Dotize from 'dotize'
import Mongoose from 'mongoose'
import Promise from 'bluebird'

import { BuildSchema } from './build'

const CycleSchema = new Mongoose.Schema({
  release: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'release'
  },

  repo: {
    type: String,
    required: true,
    validate: {
      validator: s => s.endsWidth('.git'),
      message: `{VALUE} is not a valid git repository`
    }
  },

  // Determines if we save, publish, and create issues
  _type: {
    type: String,
    default: 'ORPHAN',
    enum: ['ORPHAN', 'RELEASE']
  },
  _status: {
    type: String,
    default: 'QUEUED',
    enum: ['QUEUE', 'PRE', 'BUILD', 'POST', 'FAIL', 'FINISH']
  },

  build: [BuildSchema]
})

CycleSchema.virtual('project').get(function () {
  return this.ownerDocument()
})

CycleSchema.virtual('type')
.get(function () {
  if (this.release != null) return 'RELEASE'

  return this._type
})
.set(function (_type) {
  return this.update({ _type }, { new: true })
})

CycleSchema.virtual('version').get(function () {
  if (this.type === 'release') return this.release.version

  return '0.0.0'
})

CycleSchema.virtual('tag').get(function () {
  if (this.type === 'release') return this.release.github.tag

  return '0.0.0'
})

CycleSchema.virtual('status')
.get(function () {
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
.set(function (_status) {
  return this.update({ _status }, { new: true })
})

/**
 * Updates build nested in cycle model
 *
 * @param {Object} Object of items to update
 * @return {Object} updated build object
 */
CycleSchema.methods.update = function (obj) {
  let build = this
  if (obj[Object.keys(obj)[0]][0] !== '$') {
    obj = Dotize.convert(obj, 'cycles.$')
  }

  return build.cycle.update({
    'builds_id': build._id
  }, obj)
}

// Mongoose lifecycle functions
CycleSchema.pre('save', function (next) {
  this.wasNew = this.isNew
  next()
})

CycleSchema.post('save', function (cycle, next) {
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

export default { CycleSchema }
