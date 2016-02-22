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

import { Config, Log } from '~/app'

// TODO: move jenkins to superagent
const jenkins = (Config.jenkins)
  ? require('then-jenkins')(Config.jenkins.url)
  : null

const BuildSchema = new Mongoose.Schema({
  dist: {
    type: String,
    required: true
  },
  arch: {
    type: String,
    required: true
  },

  build: Number,
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

BuildSchema.virtual('cycle').get(function () {
  return this.ownerDocument()
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

// TODO: no services in models!
BuildSchema.methods.doBuild = async function () {
  let self = this
  const project = await self.cycle.getProject()

  if (Config.jenkins) {
    jenkins.job.build({
      name: Config.jenkins.job,
      parameters: {
        PACKAGE: project.package.name,
        REPO: self.cycle.repo,
        VERSION: self.cycle.version,
        DIST: self.dist,
        ARCH: self.arch,
        REFERENCE: self.cycle.tag,
        CYCLE: self.cycle._id
        // TODO: application changelog
      }
    })
    .then(build => self.update({ build }))
    .catch(err => Log.error(err))
  } else {
    Log.info('Jenkins has been disabled in configuration file. No build is running')
  }
}

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
BuildSchema.post('save', build => {
  build.doBuild()
})

export default { BuildSchema }
