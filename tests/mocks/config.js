/**
 * tests/mocks/config.js
 * Mock configuration for Houston testing
 *
 * @exports {Object} default - Houston configuration
 */

export const env = 'test'

export const github = {
  client: '123456789yoloswagomg',
  secret: 'butwait%20letmetakeaselfeshutthefrackup!',
  access: 'secretrobotmanthevegivenyouauuid',
  post: false,
  hook: false
}

export const rights = {
  beta: 'awesomepeople',
  admin: 213128,
  review: 1880652
}

export const aptly = {
  url: 'http://localhost:10002',
  passphrase: 'testing',
  review: 'review',
  stable: 'houston'
}

export const database = 'mongodb://localhost/houston-test'

export const server = {
  secret: 'ermagerditsasecretsodonttellanyone',
  url: 'http://localhost:3500'
}

export const socket = {
  public: 'dontworryaboutthesecret%20Igotitcoveredbro',
  private: 'butseriouslydontworryboutitok?ok.goodokbye'
}

export const log = {
  console: false,
  level: 'silly',
  files: false
}

export const strongback = {
  socket: '/var/run/docker.sock'
}
