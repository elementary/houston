/**
 * core/model/cycle.js
 * Mongoose schema for cycles
 *
 * @exports {Object} default {
 *   {Object} Cycle - Mongoose model for cycle
 *   {Object} CycleSchema - Mongoose schema for cycle model
 * }
 */

import Mongoose from 'mongoose'
import Dotize from 'dotize'
import _ from 'lodash'

import { Log } from '~/app'
import { BuildSchema } from './build'
import { io } from '~/core/io'

const CycleSchema = new Mongoose.Schema({
  // TODO: rewrite all of mongoose
  _project: Mongoose.Schema.Types.ObjectId,
  _release: Mongoose.Schema.Types.ObjectId,

  _repo: {
    type: String,
    validate: {
      validator: s => /.*\.git/.test(s),
      message: `{VALUE} is not a valid git repository`
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

  builds: [BuildSchema]
})

CycleSchema.methods.getProject = function () {
  return this.model('project').findOne({
    cycles: this._id
  })
}

CycleSchema.methods.getRelease = async function () {
  const project = await this.getProject()

  for (let i in project.releases) {
    if (project.releases[i].cycles.indexOf(this._id) !== 0) {
      return project.releases[i]
    }
  }

  return null
}

// This is weird, but it works. Don't change unless you have time to debug
CycleSchema.methods.toSolid = async function () {
  let cycle = this

  let pkg = cycle.toJSON()
  pkg.project = await cycle.getProject()
  pkg.release = await cycle.getRelease()
  pkg.repo = await cycle.getRepo()
  pkg.tag = await cycle.getTag()
  pkg.status = await cycle.getStatus()

  if (pkg.release != null) pkg.release = await pkg.release.toSolid()

  return await pkg
}

CycleSchema.methods.getRepo = async function () {
  if (this._repo != null) return this._repo

  const project = await this.getProject()
  return project.repo
}

CycleSchema.methods.getTag = async function () {
  if (this._tag != null) return this._tag
  const release = await this.getRelease()

  if (release != null) return release.tag

  const project = await this.getProject()
  return project.tag
}

// TODO: Consolidate build status
CycleSchema.methods.getStatus = async function () {
  let finish = true
  let build = false
  for (let i in this.builds) {
    if (this.builds[i].status === 'FAIL') return 'FAIL'
    if (this.builds[i].status !== 'FINISH') finish = false
    if (this.builds[i].status !== 'BUILD') build = false
  }

  // If we have builds waiting to be built
  if (this.builds.length > 0 && finish && !build) {
    return 'QUEUE'
  }

  return this._status
}

CycleSchema.methods.spawn = async function () {
  const pkg = await this.toSolid()
  io.emit('cycle', pkg)
}

CycleSchema.methods.build = async function () {
  const cycle = this
  const project = await cycle.getProject()

  for (let dist in project.distributions) {
    for (let arch in project.architectures) {
      Cycle.findByIdAndUpdate(cycle._id, {$push: {builds: {
        arch: project.architectures[arch],
        dist: project.distributions[dist]
      }}}, {new: true})
      .then(cycle => {
        for (let i in saveBuildMiddleware) {
          saveBuildMiddleware[i](cycle.builds[cycle.builds.length - 1])
        }
      })
    }
  }
}

// io listeners
// TODO: would this make more logic being in core/controller/hook/io?
io.on('connection', socket => {
  socket.on('received', data => {
    Cycle.findById(data).update({ _status: 'PRE' })
  })

  socket.on('finished', async data => {
    const cycle = await Cycle.findById(data.cycle)

    let status = 'FINISH'
    if (cycle.type === 'RELEASE') {
      cycle.build()
      status = 'BUILD'
    }
    if (data.errors > 0) status = 'FAIL'

    cycle.update({ '_status': status }).exec()

    // TODO: update project information
    const project = await cycle.getProject()
    for (let i in data.issues) {
      project.postIssue(data.issues[i])
    }
  })
})

// Find all save middleware in ReleaseSchema for custom calls that look native
// TODO: Oh dear god, why do we need this mongoose?
// FIXME: Curriously enough, the only thing going through the developer's head was
// 'Oh no. Not again.'
let saveBuildMiddleware = []
const buildMiddle = _.fromPairs(BuildSchema.callQueue)
if (buildMiddle.on != null) {
  saveBuildMiddleware = _.filter(_.map(buildMiddle.on, (v, i) => {
    if (v === 'save') return buildMiddle.on[i + 1]
  }), v => typeof v === 'function')
}

// Mongoose lifecycle functions
// TODO: move me to a middleware before project and release get cleared
CycleSchema.pre('save', function (next) {
  let query = { _id: this._project }
  let update = { cycles: this._id }

  if (this._release != null) query['releases._id'] = this._release
  if (this._release != null) update['releases.$.cycles'] = this._id

  this.model('project').update(query, {
    $addToSet: update
  }).then(next())
})

CycleSchema.post('save', async (cycle) => {
  // clean up from the code above
  await cycle.update({$unset: {_project: true, _release: true}})

  // TODO: figure out a way to detect mass import so we don't spam tests
  cycle.spawn()
})

const Cycle = Mongoose.model('cycle', CycleSchema)

export default { Cycle, CycleSchema }
