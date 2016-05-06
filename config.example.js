/**
 * config.js
 * Stores configuration for all parts of Houston
 *
 * @exports {Object} default - Houston configuration
 */

// https://github.com/settings/developers
export const github = {
  client: '78zx9c4vb8xc4v5647ar',
  secret: '4ra56dsv489asd4r56b456a489sd7ft89a75s4b8',

  // User access token for submitting issues
  access: 'ar4sd56v456as4edr564s5dv6a45sr156we48zxw',

  // Post data to GitHub?
  post: false,

  // Enable GitHub hooks?
  hook: false
}

// GitHub identifiers for admin, reviewer, and beta groups
export const rights = {
  beta: 'elementary',
  admin: 213128,
  review: 1880652
}

export const aptly = {
  url: 'http://localhost:8080/api',
  passphrase: 'gpgkeyphrase',

  // Repository names
  review: 'review',
  stable: 'houston',

  public: 'PbsPVXKo5AYtC5A0c0qn'
}

export const database = 'mongodb://localhost/houston-dev'

export const server = {
  secret: 'hiGvpfbJhSNlC15OXiCxXWcEUYVeKBqb',

  // Full route including port and protocol, without trailing slash
  url: 'http://localhost:3000'
}

export const log = {
  console: true,

  // 'silly' 'debug' 'verbose' 'info' 'warn' 'error'
  level: 'silly',

  // Create 'error.log' and 'info.log'
  files: false
}

export const strongback = {
  socket: '/var/run/docker.sock'
}
