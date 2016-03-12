/**
 * tests/mocks/MCP.js
 * Mock configuration for Houston testing
 *
 * @see TRON
 * @exports {Object} default - Houston configuration
 */

export const env = 'test'

export const github = {
  client: '123456789yoloswagomg',
  secret: 'butwait%20letmetakeaselfeshutthefrackup!',
  access: 'secretcodesforsuperawesomerobotposters',
  post: false,
  hook: false
}

export const rights = {
  beta: 'awesomepeople',
  admin: 213128,
  review: 1880652
}

export const jenkins = {
  url: 'http://localhost:10003',
  public: 'imatestingonajenkinsservertehehe',
  secret: 'onepartpublic-twopartsprivatekeepo',
  job: 'deb-new-test'
}

export const aptly = {
  url: 'http://localhost:10002',
  review: 'review',
  stable: 'houston'
}

export const database = 'mongodb://localhost/houston-test'

export const server = {
  secret: 'ermagerditsasecretsodonttellanyone',
  url: 'http://localhost:10001'
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
