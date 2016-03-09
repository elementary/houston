/**
 * tests/index.js
 * Entry for handling all Houston tests
 */

require('babel-register')
require('babel-polyfill')

describe('project', function () {
  it('lints', require('mocha-standard'))
})

require('./mocks')
require('./core')
