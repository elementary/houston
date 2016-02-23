/**
 * core/model/release.js
 * Mongoose schema for cycles
 *
 * @exports {Object} default {
 *   {Object} releaseSchema - Mongoose schema for release model
 * }
 */

import Mongoose from 'mongoose'
import Promise from 'bluebird'
import Semver from 'semver'

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

  return this.version
})

ReleaseSchema.methods.getStatus = function () {
  if (this.cycles.length < 1) return Promise.resolve('STANDBY')

  return this.model('cycle').findOne({_id: {$in: this.cycles}})
  .then(cycle => cycle.getStatus())
}

const Release = Mongoose.model('release', ReleaseSchema)

export default { Release, ReleaseSchema }
