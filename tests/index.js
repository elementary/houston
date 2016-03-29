/**
 * tests/index.js
 * Entry for handling all Houston tests
 */

describe('project', function () {
  it('lints', require('mocha-standard'))
})

require('./mocks')
require('./lib')
require('./core')
