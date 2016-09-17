/**
 * test/lib/config/loading.js
 * Tests the accuracty of configuration loading
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from './fixtures/config'

test('can be loaded', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  const config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default

  t.is(typeof config, 'object')
  t.is(config['database'], 'mongodb://localhost/houston-test')
  t.is(config['server']['secret'], 'ermagerditsasecretsodonttellanyone')
  t.truthy(config['houston']['version'])
})
