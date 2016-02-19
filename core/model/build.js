/**
 * core/model/build.js
 * Mongoose schema for builds
 *
 * @exports {Object} default {
 *   {Object} buildSchema - Mongoose schema for build model
 * }
 */

import Mongoose from 'mongoose'
import Promise from 'bluebird'
import Dotize from 'dotize'

import { Config } from '~/app'

const jenkins = (Config.jenkins)
  ? require('then-jenkins')(Config.jenkins.url)
  : null

const BuildSchema = new Mongoose.Schema({
  arch: {
    type: String,
    required: true
  },
  dist: {
    type: String,
    required: true
  },

  build: Number,
  log: String,
  _status: {
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

BuildSchema.virtual('cycle').get(function () {
  return this.ownerDocument()
})

BuildSchema.virtual('status')
.get(function () {
  return this._status
})
.set(function (_status) {
  let build = this
  let actions = []
  let update = { _status }

  if (_status === 'FAIL') actions.push(this.getLog())

  if (_status === 'FAIL' || _status === 'FINISH') {
    update.finished = new Date()
  }

  return Promise.all(actions)
  .then(build.update(update, { new: true }))
})

/**
 * Updates build nested in cycle model
 *
 * @param {Object} Object of items to update
 * @return {Object} updated build object
 */
// FIXME: drunken coding results in mostly broken code TIL
BuildSchema.methods.update = function (obj) {
  let build = this
  let update = Dotize.convert(obj, 'cycle.$')

  return build.cycle.update({
    'builds_id': build._id
  }, update)
}

/**
 * Creates a build in jenkins
 *
 * @return {Object} updated build object
 */
BuildSchema.methods.doBuild = function () {
  let self = this

  if (Config.jenkins) {
    return jenkins.job.build({
      name: Config.jenkins.job,
      parameters: {
        PACKAGE: self.project.package.name,
        REPO: self.cycle.repo,
        VERSION: self.cycle.version,
        DIST: self.dist,
        ARCH: self.arch,
        REFERENCE: self.cycle.tag,
        IDENTIFIER: `${self.cycle._id}#${self.dist}-${self.arch}`
        // TODO: application changelog
      }
    })
    .then(build => self.update({ build }))
  }

  return Promise.resolve(0)
  .then(build => self.update({ build }))
}

/**
 * Grabs log from jenkins
 *
 * @return {Object} updated build object
 */
BuildSchema.methods.getLog = function () {
  let self = this

  if (Config.jenkins) {
    return jenkins.build.log(Config.jenkins.job, self.build)
    .then(log => self.update({ log }))
  }

  return Promise.resolve('Logs disabled in configuration file')
  .then(log => self.update({ log }))
}

// Mongoose lifecycle functions
BuildSchema.pre('save', function (next) {
  this.wasNew = this.isNew
  next()
})

BuildSchema.post('save', function (build, next) {
  if (build.wasNew) {
    return build.doBuild()
    .then(next)
  } else {
    next()
  }
})

export default { BuildSchema }
