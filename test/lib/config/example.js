/**
 * test/lib/config/example.js
 * Tests the accuracty of configuration loading while checking example data
 */

import test from 'ava'
import mock from 'mock-require'

import mockConfig from './fixtures/config'

test('config against example config for missing values', (t) => {
  mock('../../../config', mockConfig)
  mock('../../../config.example.js', Object.assign({}, mockConfig, {
    github: {
      example: 'this value will never exist in the configuration'
    }
  }))

  t.throws(() => require('../../../src/lib/config').default)
})
