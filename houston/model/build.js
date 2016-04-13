/**
 * houston/model/build.js
 * Mongoose schema for builds
 *
 * @exports {Object} - build database model
 * @exports {Object} schema - build database schema
 */

import * as jenkins from '~/houston/service/jenkins'
import config from '~/lib/config'
import db from '~/lib/database'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'

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

  jenkins: {
    build: Number,
    queue: Number
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

// TODO: no services in models!
schema.methods.doBuild = async function () {
  const cycle = await this.getCycle()
  const project = await this.getProject()

  const changelog = await project.generateChangelog(this.dist, this.arch)
  log.debug(`Generated changelog for ${project.github.fullName}\n${changelog}`)

  if (config.jenkins) {
    return jenkins.build({
      PACKAGE: project.name,
      VERSION: await cycle.getVersion(),
      REPO: await cycle.getRepo(),
      DIST: this.dist,
      ARCH: this.arch,
      CHANGELOG: changelog,
      REFERENCE: await cycle.getTag(),
      IDENTIFIER: this._id.toString()
    })
    .then((queue) => this.update({ 'jenkins.queue': queue }))
    .catch((err) => {
      throw new Mistake(500, `Houston was unable to start a build for ${project.name}`, err)
    })
  } else {
    log.info('Jenkins has been disabled in configuration file. No build is running')
    return Promise.resolve()
  }
}

schema.methods.getLog = function () {
  if (config.jenkins) {
    return jenkins.log(this.jenkins.build)
    .then((log) => this.model('build').findByIdAndUpdate(this._id, { log }, { new: true }))
  }

  return Promise.resolve('Logs disabled in configuration file')
  .then((log) => this.model('build').findByIdAndUpdate(this._id, { log }, { new: true }))
}

export default db.model('build', schema)
