/**
 * tests/index.js
 * Entry for handling all Houston tests
 */

import mock from 'mock-require'
import path from 'path'

// Required for any imports not in a mocha test
mock(path.resolve(__dirname, '../config'), require('./mocks/config'))

Promise.onPossiblyUnhandledRejection((error) => {
  // eslint-disable-next-line no-console
  console.log(error)
})

it('lints', require('mocha-standard'))

beforeEach(() => {
  mock(path.resolve(__dirname, '../config'), require('./mocks/config'))
})

afterEach(() => {
  mock.stopAll()
})

require('./lib')
require('./flightcheck')
