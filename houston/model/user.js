/**
 * houston/model/user.js
 * Mongoose modal and schema for user accounts
 *
 * @exports {Object} - user database model
 * @exports {Object} schema - user database schema
 */

import db from '~/lib/database'

export const schema = new db.Schema({
  username: String,
  email: String,
  avatar: String,

  github: {
    id: String,        // GitHub id for authentication
    access: String,    // GitHub token
    refresh: String    // Github token
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
    type: db.Schema.Types.ObjectId,
    ref: 'project'
  }]
})

export default db.model('user', schema)
