/**
 * core/model/user.js
 * Mongoose modal and schema for user accounts
 *
 * @exports {Object} default {
 *   {Object} user - Mongoose user model
 *   {Object} userSchema - Mongoose schema for user model
 * }
 */

import { Db as Mongoose } from '~/app'

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

  projects: [{
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'project'
  }]
})

const User = Mongoose.model('user', UserSchema)

export default { User, UserSchema }
