/**
 * tests/lib/fixtures/config.js
 * Mock configuration for houston testing
 *
 * @exports {Object} default - Houston configuration
 */

const path = require('path')

module.exports.env = 'test'

module.exports.github = {
  client: '123456789yoloswagomg',
  secret: 'butwait%20letmetakeaselfeshutthefrackup!',
  integration: {
    id: 11,
    key: path.resolve(__dirname, 'github', 'private.pem'),
    secret: 'asecretwebhookkey'
  },
  post: false,
  hook: false
}

module.exports.stripe = {
  client: 'ca_189s189v1s8d1v89s1dv91sd9vw4ef84',
  secret: 'sk_test_hF23f23ra42cru8902m3umSN',
  public: 'pk_test_c32j0239j9tg8902j3f90238'
}

module.exports.rights = {
  beta: 'awesomepeople',
  admin: 213128,
  review: 1880652
}

module.exports.aptly = {
  url: 'http://localhost:10002',
  passphrase: 'testing',
  review: 'review',
  stable: 'houston',
  public: '2Rm7LJ5gXK7qRQpC6FfdxGLTTbMUnSrh'
}

module.exports.database = 'mongodb://localhost/houston-test'

module.exports.server = {
  secret: 'ermagerditsasecretsodonttellanyone',
  url: 'http://localhost:3500'
}

module.exports.socket = {
  public: 'dontworryaboutthesecret%20Igotitcoveredbro',
  private: 'butseriouslydontworryboutitok?ok.goodokbye'
}

module.exports.log = 'debug'

module.exports.flightcheck = {
  directory: '/tmp/flightcheck',
  docker: '/var/run/docker.sock'
}

module.exports.downloads = {
  port: 3001
}
