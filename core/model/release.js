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

import { Cycle } from './cycle'

const ReleaseSchema = new Mongoose.Schema({
  github: {
    id: Number,              // Id for Github API
    author: String,          // Github user login
    date: Date,              // Github publish date
    tag: String              // Github uncleaned tag (v4.2.3)
  },

  changelog: [String],

  cycles: [{
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'cycle'
  }]
})

ReleaseSchema.set('toJSON', { virtuals: true })

ReleaseSchema.virtual('version').get(function () {
  if (this.github.tag != null) return Semver.clean(this.github.tag, true)

  return '0.0.0'
})

ReleaseSchema.virtual('tag').get(function () {
  if (this.github.tag != null) return this.github.tag

  return null
})

ReleaseSchema.methods.toSolid = async function () {
  let release = this.toJSON()
  release.status = await this.getStatus()

  return release
}

ReleaseSchema.methods.getStatus = async function () {
  if (this.cycles.length < 1) return 'STANDBY'

  let cycles = await this.getCycles()
  cycles = cycles.reverse()

  for (let i in cycles) {
    if (cycles[i].type === 'RELEASE') return cycles[i].getStatus()
    if (cycles[i].type === 'INIT') {
      let status = await cycles[i].getStatus()
      if (status !== 'FINISH') return status
    }
  }

  return 'STANDBY'
}

ReleaseSchema.methods.getCycle = async function () {
  const cycles = await this.getCycles()

  if (cycles == null || cycles.length < 1) return null
  return cycles[0]
}

ReleaseSchema.methods.getCycles = async function () {
  return await Cycle.find({_id: { $in: this.cycles }})
}

ReleaseSchema.methods.createCycle = async function (type) {
  const release = this
  const project = release.ownerDocument()

  return Cycle.create({
    _project: project._id,
    _release: release._id,
    _tag: release.tag,
    type: type
  })
}

ReleaseSchema.post('save', release => {
  release.createCycle('INIT')
})

export default { ReleaseSchema }
