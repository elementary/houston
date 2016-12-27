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
    key: path.resolve(__dirname, 'github.pem'),

    // GitHub webhook secret
    secret: 'thisisawebhooksecuritystring'
  },

  // Post data to GitHub?
  post: false,

  // Enable GitHub hooks?
  hook: false
}

// https://dashboard.stripe.com/account/apikeys
module.exports.stripe = {
  client: 'ca_189s189v1s8d1v89s1dv91sd9vw4ef84',
  secret: 'sk_test_hF23f23ra42cru8902m3umSN',
  public: 'pk_test_c32j0239j9tg8902j3f90238'
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
