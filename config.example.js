/**
 * config.js
 * Stores configuration for all parts of Houston
 *
 * @exports {Object} default - Houston configuration
 */

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
  beta: 'elementary',

  // https://developer.github.com/v3/orgs/teams/#get-team
  admin: 213128,
  reviewer: 1880652
}
*/

export const jenkins = false

/*
export const jenkins = {
  url: 'http://john:1234@jenkins.elementaryos.org',
  public: 'public',
  secret: 'test',

  // Job name for building deb files
  job: 'deb-new-test'
}
*/

export const database = 'mongodb://localhost/houston-dev'

export const server = {
  port: 3000,
  secret: 'LearntocodeCreatethefuture'
}

export const log = {
  console: true,

  // 'silly' 'debug' 'verbose' 'info' 'warn' 'error'
  level: 'silly',

  // Create 'error.log' and 'info.log'
  files: false
}
