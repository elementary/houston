/**
 * test/lib/config/loaded.js
 * Tests the accuracty of configuration loading with environment variables
 */

import test from 'ava'
import mock from 'mock-require'

import mockConfig from './fixtures/config'

process.env.HOUSTON_SERVER_SECRET = 'testing'

test('uses environment settings', (t) => {
  mock('../../../config', mockConfig)

  const config = require('../../../src/lib/config').default

  t.is(config['server']['secret'], 'testing')
})
