/**
 * lib/database/user.js
 * Mongoose modal and schema for user accounts
 *
 * @exports {Object} schema - user database schema
 * @exports {Object} default - user database model
 */

import db from './connection'

/**
 * @type {object} - User database schema
 *
 * @property {String} username - user's username (btkostner)
 * @property {String} email - user's email (blake@elementary.io)
 * @property {Object} avatar - gravatar url
 *
 * @property {Object} github - object holding github records
 * @property {String} github.id - github account id
 * @property {String} github.acceses - github oauth access code
 * @property {String} github.refresh - github oauth refresh code
 *
 * @property {String} right - user's permission scheme
 * @property {Object} notify - boolean keys for notifications
 * @property {Boolean} notify.beta - true if we should notify about beta launch
 *
 * @property {Object} date - object of dates
 * @property {Date} date.joined - date when user account was first created
 * @property {Date} date.visited - last login date of user
 * @property {Date} date.left - date when user deactivated account
 *
 * @property {Array} projects - all projects the user has initalized in houston
 */
export const schema = new db.Schema({
  username: String,
  email: String,
  avatar: String,

  github: {
    id: String,
    access: String,
    refresh: String
  },

  right: {
    type: String,
    default: 'USER',
    enum: ['USER', 'BETA', 'REVIEW', 'ADMIN']
  },
  notify: {
    beta: {
      type: Boolean,
      default: false
    }
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
