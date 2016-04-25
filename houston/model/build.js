/**
 * houston/model/build.js
 * Mongoose schema for builds
 *
 * @exports {Object} - build database model
 * @exports {Object} schema - build database schema
 */

import config from '~/lib/config'
import db from '~/lib/database'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'

import atc from '~/houston/service/atc'

export const schema = new db.Schema({
  dist: {
    type: String,
    required: true
  },
  arch: {
    type: String,
    required: true
  },

  log: String,
  status: {
    type: String,
    default: 'QUEUE',
    enum: ['QUEUE', 'BUILD', 'FAIL', 'FINISH']
  },

  started: {
    type: Date,
    default: new Date()
  },
  finished: Date
})

schema.methods.getCycle = function () {
  return this.model('cycle').findOne({builds: this._id})
}

schema.methods.getProject = async function () {
  const cycle = await this.getCycle()

  if (cycle == null) {
    return Promise.reject("Unable to find build's cycle")
  }

  return cycle.getProject()
}

schema.methods.doBuild = async function () {
  const cycle = await this.getCycle()
  const project = await this.getProject()

  log.debug(`Building ${project.github.fullName} for ${this.arch} on ${this.dist}`)

  return atc.send('strongback', {
    owner: project.github.owner,
    repo: project.github.repo,
    arch: this.arch,
    dist: this.dist,
    tag: await cycle.getTag(),
    token: project.github.token,
    changelog: await project.generateChangelog(this.dist, this.arch),
    version: await cycle.getVersion()
  })
  .catch((err) => {
    throw new Mistake(500, `Houston was unable to start a build for ${project.name}`, err)
  })
}

export default db.model('build', schema)
