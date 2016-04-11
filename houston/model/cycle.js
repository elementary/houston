/**
 * houston/model/cycle.js
 * Mongoose schema for cycles
 *
 * @exports {Object} - cycle database model
 * @exports {Object} schema - cycle database schema
 */

import db from '~/lib/database'
import atc from '~/lib/atc'
import Build from './build'
import * as aptly from '~/houston/service/aptly'

export const schema = new db.Schema({
  _repo: {
    type: String,
    validate: {
      validator: (s) => /.*\.git/.test(s),
      message: '{VALUE} is not a valid git repository'
    }
  },
  _tag: {
    type: String
  },

  // Determines what we do with the test results
  type: {
    type: String,
    required: true,
    enum: ['INIT', 'ORPHAN', 'RELEASE']
  },
  _status: {
    type: String,
    default: 'QUEUE',
    enum: ['QUEUE', 'PRE', 'POST', 'REVIEW', 'FAIL', 'FINISH']
  },

  builds: [{
    type: db.Schema.Types.ObjectId,
    ref: 'build'
  }],
  packages: [String]
})

schema.methods.getProject = function () {
  return this.model('project').findOne({
    cycles: this._id
  })
}

schema.methods.getRelease = function () {
  return this.model('release').findOne({
    cycles: this._id
  })
}

schema.methods.getVersion = async function () {
  const release = await this.getRelease()

  if (release != null) return release.version

  const project = await this.getProject()
  return project.getVersion()
}

schema.methods.getRepo = async function () {
  if (this._repo != null) return Promise.resolve(this._repo)

  const project = await this.getProject()
  if (project != null) return project.repo

  return null
}

schema.methods.getTag = async function () {
  if (this._tag != null) return this._tag

  const release = await this.getRelease()
  if (release != null) return release.tag

  const project = await this.getProject()
  if (project != null) return project.tag

  return Promise.resolve('master')
}

// TODO: Consolidate build status
schema.methods.getStatus = async function () {
  const builds = await this.model('build').find({_id: {$in: this.builds}})

  let queue = false
  let build = false
  let fail = false
  let finish = true
  for (const i in builds) {
    if (builds[i].status !== 'QUEUE') queue = true
    if (builds[i].status === 'BUILD') build = true
    if (builds[i].status === 'FAIL') fail = true
    if (builds[i].status !== 'FINISH') finish = false
  }

  // If we have builds waiting to be built
  if (builds.length > 0 && !finish) {
    if (fail) return Promise.resolve('FAIL')
    if (build) return Promise.resolve('BUILD')
    if (queue) return Promise.resolve('QUEUE')
  }

  // Push the status to next step
  // TODO: fix the if statement OF DOOM
  if (builds.length > 0 && finish) {
    if (['POST', 'REVIEW', 'FAIL', 'FINISH'].indexOf(this._status) === -1) {
      if (this.type === 'RELEASE') {
        // TODO: add in the POST step
        return this.update({ _status: 'REVIEW' })
        .then(() => 'REVIEW')
      }
    }
  }

  return Promise.resolve(this._status)
}

schema.methods.spawn = async function () {
  return Promise.all([
    this.getProject(),
    this.getRelease(),
    this.getRepo(),
    this.getTag()
  ])
  .then(([project, release, repo, tag]) => {
    atc.send('cycle:start', {
      repo,
      tag,
      project,
      release,
      cycle: this
    }, () => {
      this.update({ _status: 'PRE' })
    })
  })
}

schema.methods.build = async function () {
  const cycle = this
  const project = await cycle.getProject()

  if (project == null) return project.reject('Unable to find project')

  const builds = []

  for (const dist in project.distributions) {
    for (const arch in project.architectures) {
      builds.push(new Build({
        dist: project.distributions[dist],
        arch: project.architectures[arch]
      }))
    }
  }

  const ids = builds.map((b) => b._id)

  return Promise.all([
    cycle.update({$pushAll: {builds: ids}}).exec(),
    Build.create(builds)
  ])
}

schema.methods.release = async function () {
  const project = await this.getProject()

  return aptly.stable(this.packages, project.distributions)
}

// io listeners
// TODO: would this make more logic being in houston/controller/hook/io?
atc.on('cycle:finished', async (data) => {
  const cycle = await cycle.findById(data.cycle)

  let status = 'FINISH'
  if (data.errors > 0) status = 'FAIL'
  if (cycle.type === 'RELEASE' && status !== 'FAIL') {
    cycle.build()
    status = 'BUILD'
  }

  cycle.update({ '_status': status }).exec()

  // TODO: update project information
  const project = await cycle.getProject()
  for (const i in data.issues) {
    project.postIssue(data.issues[i])
  }
})

// TODO: figure out a way to detect mass import so we don't spam tests
schema.post('save', async (cycle) => {
  cycle.spawn()
})

export default db.model('cycle', schema)
