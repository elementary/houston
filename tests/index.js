/**
 * tests/index.js
 * Entry for handling all Houston tests
 */

import mock from 'mock-require'

// Required for any imports not in a mocha test
mock('../config', require('./mocks/config'))

it('lints', require('mocha-standard'))

beforeEach(() => {
  mock('../config', require('./mocks/config'))
})

afterEach(() => {
  Object.keys(require.cache).forEach((key) => {
    delete require.cache[key]
  })

  mock.stopAll()
})

require('./lib')
