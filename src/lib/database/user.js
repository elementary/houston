/**
 * lib/database/user.js
 * Mongoose modal and schema for user accounts
 *
 * @exports {Object} schema - user database schema
 * @exports {Object} default - user database model
 */

import db from './connection'

// AGREEMENTDATE is the date the current TOS was created
// NOTE: JavaScript's month starts at zero
const AGREEMENTDATE = new Date(2017, 0, 13)

/**
 * @type {object} - User database schema
 *
 * @property {String} username - user's username
 * @property {String} email - user's email
 * @property {Object} [avatar] - gravatar url
 *
 * @property {Object} github - object holding github records
 * @property {String} github.id - github account id
 * @property {String} github.acceses - github oauth access code
 * @property {String} github.refresh - github oauth refresh code
 *
 * @property {String} right - user's permission scheme
 * @property {Object} notify - boolean keys for notifications
 * @property {Boolean} notify.agreement - true if we should notify about TOS agreement
 * @property {Boolean} notify.beta - true if we should notify about beta launch
 *
 * @property {Object} date - object of dates
 * @property {Date} date.joined - date when user account was first created
 * @property {Date} [date.visited] - last login date of user
 * @property {Date} [date.agreement] - date when the user agreed to TOS agreement
 * @property {Date} [date.left] - date when user deactivated account
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
    agreement: Date,
    left: Date
  },

  projects: [{
    type: db.Schema.Types.ObjectId,
    ref: 'project'
  }]
})

/**
 * GET notify.agreement
 * Tests if the user should be notified about a new agreement
 *
 * @returns {Boolean} - true if the user needs to accept the agreement
 */
schema.virtual('notify.agreement').get(function () {
  if (this.date.agreement == null) return true

  return (this.date.agreement.getTime() < AGREEMENTDATE.getTime())
})

/**
 * SET notify.agreement
 * Sets the agreement date from a boolean
 *
 * @param {Boolean} - true if the user needs to accept the agreement
 */
schema.virtual('notify.agreement').set(function (t) {
  if (t === true) {
    this.date.agreement = null
  } else {
    this.date.agreement = new Date()
  }
})

export default db.model('user', schema)
