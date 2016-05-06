/**
 * houston/model/release.js
 * Mongoose schema for cycles
 *
 * @exports {Object} - Houston database model
 * @exports {Object} schema - Houston database schema
 */

import semver from 'semver'

import db from '~/lib/database'

export const schema = new db.Schema({
  github: {
    id: Number,              // Id for Github API
    author: String,          // Github user login
    date: Date,              // Github publish date
    tag: String              // Github uncleaned tag (v4.2.3)
  },

  changelog: [String],

  cycles: [{
    type: db.Schema.Types.ObjectId,
    ref: 'cycle'
  }]
})

schema.set('toJSON', { virtuals: true })

schema.virtual('version').get(function () {
  if (this.github.tag != null) return semver.clean(this.github.tag, true)

  return '0.0.0'
})

schema.virtual('github.debianDate').get(function () {
  return this.github.date.toUTCString().replace('GMT', '+0000')
})

schema.virtual('tag').get(function () {
  if (this.github.tag != null) return this.github.tag

  return this.version
})

schema.methods.getStatus = function () {
  if (this.cycles.length < 1) return Promise.resolve('STANDBY')

  return this.model('cycle')
  .findOne({_id: this.cycles[this.cycles.length - 1]})
  .then((cycle) => cycle.getStatus())
}

export default db.model('release', schema)
