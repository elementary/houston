/**
 * config.js
 * Stores configuration for all parts of Houston
 *
 * @exports {Object} default - Houston configuration
 */

const path = require('path')

// https://github.com/settings/developers
module.exports.github = {
  client: '78zx9c4vb8xc4v5647ar',
  secret: '4ra56dsv489asd4r56b456a489sd7ft89a75s4b8',

  // GitHub integration https://developer.github.com/early-access/integrations
  integration: {
    id: 11,

    // Full path to GitHub integration private key.
    key: path.resolve(__dirname, 'github.pem')
  },

  // Post data to GitHub?
  post: false,

  // Enable GitHub hooks?
  hook: false
}

// GitHub identifiers for admin, reviewer, and beta groups
module.exports.rights = {
  beta: 'elementary',
  admin: 213128,
  review: 1880652
}

module.exports.aptly = {
  url: 'http://localhost:8080/api',
  passphrase: 'gpgkeyphrase',

  // Repository names
  review: 'review',
  stable: 'houston'
}

module.exports.database = 'mongodb://localhost/houston-dev'

module.exports.server = {
  secret: 'hiGvpfbJhSNlC15OXiCxXWcEUYVeKBqb',

  // Full route including port and protocol, without trailing slash
  url: 'http://localhost:3000'
}

// 'debug' 'info' 'warn' 'error'
module.exports.log = 'info'

// Sentry exception capturing
// https://docs.sentry.io/hosted/quickstart/#about-the-dsn
module.exports.sentry = null

module.exports.flightcheck = {
  directory: '/tmp/flightcheck',
  docker: '/var/run/docker.sock'
}

// Nginx repository syslog server
module.exports.downloads = {
  port: 3001
}
