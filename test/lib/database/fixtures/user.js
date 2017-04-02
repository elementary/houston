/**
 * test/lib/database/fixtures/user.js
 * Some fixture data for a database User
 *
 * @exports {Function} mockUser - Mocks a User object
 * @exports {Object} user - a single User object
 */

import _ from 'lodash'

/**
 * mockUser
 * Some fixture data for a database User
 *
 * @param {Object} def - default values for a User
 * @return {Object} - a mocked User object
 */
export function mockUser (def = {}) {
  return _.merge({
    username: 'test',
    email: 'test@test.com',
    avatar: null,

    github: {
      id: '123456',
      access: 'access',
      refresh: null,

      cache: null,
      projects: null
    },

    right: 'USER',
    notify: {
      beta: false
    },

    date: {
      joined: new Date(),
      visited: new Date()
    },

    projects: []
  }, def)
}

export const user = mockUser()
