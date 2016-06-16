/**
 * houston/model/user.js
 * Mongoose modal and schema for user accounts
 *
 * @exports {Object} - user database model
 * @exports {Object} schema - user database schema
 */

import db from '~/lib/database'

/**
 * @param {String} username - user's username (btkostner)
 * @param {String} email - user's email (blake@elementary.io)
 * @param {Object} avatar - gravatar url
 * @param {Object} github - {
 *   {String} id - github account id
 *   {String} acceses - github oauth access code
 *   {String} refresh - github oauth refresh code
 * }
 * @param {String} right - user's permission scheme
 * @param {Object} date - {
 *    {Date} joined - date when user account was first created
 *    {Date} visited - last login date of user
 *    {Date} left - date when user deactivated account
 * }
 * @param {Array} projects - all projects the user has initalized in houston
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
