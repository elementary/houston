/**
 * config.js
 * Stores configuration for all parts of Houston
 *
 * @exports {Object} default - Houston configuration
 */

// 'test' 'development' 'production'
// export const env = 'development'

// https://github.com/settings/developers
export const github = {
  client: '12345679101112131415',
  secret: '1234567891011121314151617181920212223242',

  // Post data to GitHub?
  post: false,

  // Enable GitHub hooks?
  hook: false
}

// GitHub identifiers for admin, reviewer, and beta groups
export const rights = false

/*
export const rights = {

  // https://developer.github.com/v3/orgs/teams/#get-team
  beta: 'elementary',
  admin: 213128,
  review: 1880652
}
*/

export const jenkins = false

/*
export const jenkins = {
  url: 'http://john:1234@jenkins.elementaryos.org',
  public: 'ZPYYkQFAL7nShsnczM4uWGmjbVPLZCp7',
  secret: 'ft2DH0i6zixHGpShlWt99vgCL7uBpqKT',

  // Job name for building deb files
  job: 'deb-new-test'
}
*/

export const aptly = false

/*
export const aptly = {
  url: 'http://localhost:8080/api',

  // Repository names
  review: 'review',
  stable: 'houston'
}
*/

export const database = 'mongodb://localhost/houston-dev'

export const server = {
  port: 3000,
  secret: 'hiGvpfbJhSNlC15OXiCxXWcEUYVeKBqb',

  // Full route including port and protocol, without trailing slash
  url: 'http://localhost:3000'
}

export const socket = {
  public: 'VcSpPL255upq4vF5nGJjmOWVUgbQGYcc',
  private: 'KUfwXUo3HDVvErvAyVp113SLE3zcQLZm'
}

export const log = {
  console: true,

  // 'silly' 'debug' 'verbose' 'info' 'warn' 'error'
  level: 'silly',

  // Create 'error.log' and 'info.log'
  files: false
}
