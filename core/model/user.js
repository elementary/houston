/**
 * core/model/user.js
 * Mongoose modal and schema for builds
 *
 * @exports {Object} default {
 *   {Object} user - Mongoose user model
 *   {Object} userSchema - Mongoose schema for user model
 * }
 */

import Mongoose from 'mongoose'

import { Config, Log, Request } from '~/app'
import { Project } from './project'

const UserSchema = new Mongoose.Schema({
  username: String,
  email: String,
  avatar: String,

  github: {
    id: String,                   // GitHub id for authentication
    access: String,               // GitHub token
    refresh: String               // Github token
  },

  right: {
    type: String,
    default: 'USER',
    enum: ['USER', 'BETA', 'REVIEW', 'ADMIN']
  },

  date: {
    joined: {
      type: Date,
      default: new Date()
    },
    visited: Date,
    left: Date
  },

  projects: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'project'
  }
})

/**
 * Gets all Projects that user ownes
 *
 * @return {Array} project documents
 */
UserSchema.methods.getProjects = function () {
  return Project.find({ owner: this._id }).exec()
}

/**
 * Updates user with rights given by GitHub
 *
 * @return {Object} updated user object
 */
UserSchema.methods.getRights = async function () {
  const user = this

  let promiseMember = function (member, username) {
    let request = ''
    if (typeof member === 'number') {
      request = `https://api.github.com/teams/${member}/memberships/${username}`
    } else {
      request = `https://api.github.com/orgs/${member}/members/${username}`
    }

    return Request
    .get(request)
    .auth(user.github.access)
    .then(data => {
      if (data.body != null) return (data.body.state === 'active')
      if (data.statusType === 2) return true
      return false
    })
    .catch(() => false)
  }

  if (Config.rights) {
    let right = 'USER'

    const beta = await promiseMember(Config.rights.beta, user.username)
    const review = await promiseMember(Config.rights.review, user.username)
    const admin = await promiseMember(Config.rights.admin, user.username)

    if (admin) {
      right = 'ADMIN'
    } else if (review) {
      right = 'REVIEW'
    } else if (beta) {
      right = 'BETA'
    }

    Log.verbose(`Giving new right of ${right} to ${user.username}`)

    return User.findByIdAndUpdate(user._id, { right }).exec()
  }

  Log.warn(`Rights are currently disabled. Giving unrestricted access to ${user.username}`)
  Log.warn('Clear database before setting up a production environment!')

  return User.findByIdAndUpdate(user._id, { right: 'ADMIN' }).exec()
}

// Mongoose lifecycle functions
UserSchema.post('remove', doc => {
  doc.getProjects()
  .each(project => {
    return project.remove()
  })
  .catch(err => {
    Log.warn(`Error while removing all projects from ${doc.username}`)
    Log.error(err)
  })
})

const User = Mongoose.model('user', UserSchema)

export default { User, UserSchema }
