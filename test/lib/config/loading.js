/**
 * test/lib/config/loading.js
 * Tests the accuracty of configuration loading
 */

import test from 'ava'
import mock from 'mock-require'

import mockConfig from './fixtures/config'

test('can be loaded', (t) => {
  mock('../../../config', mockConfig)

  const config = require('../../../src/lib/config').default

  t.is(typeof config, 'object')
  t.is(config['database'], 'mongodb://localhost/houston-test')
  t.is(config['server']['secret'], 'ermagerditsasecretsodonttellanyone')
  t.truthy(config['houston']['version'])
})
