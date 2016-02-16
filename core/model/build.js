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
import Application from './application'

const jenkins = (Config.jenkins)
  ? require('then-jenkins')(Config.jenkins.url)
  : null

const buildSchema = new Mongoose.Schema({
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
  status: {
    type: String,
    default: 'QUEUED',
    enum: ['QUEUE', 'BUILD', 'FAIL', 'FINISH']
  },

  started: {
    type: Date,
    default: new Date()
  },
  finished: Date
})

buildSchema.virtual('cycle').get(function () {
  return this.ownerDocument()
})

/**
 * Updates build nested in cycle model
 *
 * @param {Object} Object of items to update
 * @return {Object} updated build object
 */
buildSchema.methods.update = function (obj) {
  let self = this
  let update = Dotize.convert(obj, 'cycle.$.build.$')

  return Application.findOneAndUpdate({
    _id: self.cycle.application._id,
    'cycle._id': self.cycle._id,
    'cycle.build._id': self._id
  }, { update }, { new: true })
  .then(application => application.cycle.build.id(self._id))
}

/**
 * The most used build function
 * Sets status on build and runs the needed functions
 *
 * @param {String} requested status
 * @return {Object} updated build object
 */
buildSchema.methods.status = function (status) {
  let self = this

  let updates = []

  if (status === 'FAIL') {
    updates.push(self.log())
  }

  if (status === 'FAIL' || status === 'FINISH') {
    updates.push(self.update({ finished: new Date() }))
  }

  return Promise.all(updates)
  .then(() => self.update({ status }))
}

/**
 * Creates a build in jenkins
 *
 * @return {Object} updated build object
 */
buildSchema.methods.build = function () {
  let self = this

  if (Config.jenkins) {
    return jenkins.job.build({
      name: Config.jenkins.job,
      parameters: {
        PACKAGE: self.application.package.name,
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
buildSchema.methods.log = function () {
  let self = this

  if (Config.jenkins) {
    return jenkins.build.log(Config.jenkins.job, self.build)
    .then(log => self.update({ log }))
  }

  return Promise.resolve('Logs disabled in configuration file')
  .then(log => self.update({ log }))
}

// Mongoose lifecycle functions
buildSchema.pre('save', function (next) {
  this.wasNew = this.isNew
  next()
})

buildSchema.post('save', function (build, next) {
  if (build.wasNew) {
    return build.build()
    .then(() => next)
  } else {
    next()
  }
})

export default { buildSchema }
