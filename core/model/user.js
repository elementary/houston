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
import Hubkit from 'hubkit'

import { Config, Log } from '~/app'

const UserSchema = new Mongoose.Schema({
  username: String,
  email: String,
  avatar: String,

  github: {
    access: String,               // GitHub token
    refresh: String               // Github token
  },

  right: {
    type: String,
    default: 'user',
    enum: ['user', 'beta', 'review', 'admin']
  },

  date: {
    joined: Date,
    visited: Date,
    left: Date
  },

  projects: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'project'
  }
})

/**
 * Updates user with rights given by GitHub
 *
 * @return {Object} updated user object
 */
UserSchema.methods.getRights = async function () {
  const user = this
  const github = new Hubkit({
    token: user.github.access
  })

  let boolMember = async function (member, username) {
    let request = ''
    if (typeof member === 'number') {
      request = `GET /teams/${member}/membership/${username}`
    } else {
      request = `GET /orgs/${member}/members/${username}`
    }

    let body = await github.request(request)

    console.log(body)

    return true
  }

  if (Config.rights) {
    let right = 'user'

    if (boolMember(Config.rights.admin, user.username)) {
      right = 'admin'
    } else if (boolMember(Config.rights.review, user.username)) {
      right = 'review'
    } else if (boolMember(Config.rights.beta, user.username)) {
      right = 'beta'
    }

    if (user.right === right) {
      return user
    }

    return user.update({ right }, { new: true })
  }

  Log.warn(`Rights are currently disabled. Giving unrestricted access to ${user.username}`)
  Log.warn('Clear database before setting up a production environment!')

  if (user.right === 'admin') {
    return user
  }

  return user.update({ right: 'admin' }, { new: true })
}

// Mongoose lifecycle functions
UserSchema.post('remove', doc => {
  let projects = []

  for (let i in doc.projects) {
    projects.push(doc.projects[i].remove())
  }

  Promise.all(projects)
  .catch(err => {
    Log.warn(`Error while removing all projects from ${doc.username}`)
    Log.error(err)
  })
})

export default { UserSchema }
