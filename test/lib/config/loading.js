/**
 * test/lib/config/loading.js
 * Tests the accuracty of configuration loading
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from './fixtures/config'

test.beforeEach('setup configuration mock', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)
  t.context.ifRole = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
})

test('can be loaded', (t) => {
  const config = t.context.ifRole

  t.is(typeof config, 'object')
  t.is(config['database'], 'mongodb://localhost/houston-test')
  t.is(config['server']['secret'], 'ermagerditsasecretsodonttellanyone')
  t.truthy(config['houston']['version'])
})
