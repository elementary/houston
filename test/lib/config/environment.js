/**
 * test/lib/config/loaded.js
 * Tests the accuracty of configuration loading with environment variables
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from './fixtures/config'

process.env.HOUSTON_SERVER_SECRET = 'testing'

test.beforeEach('setup configuration mock', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)
  t.context.config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
})

test('uses environment settings', (t) => {
  const config = t.context.config

  t.is(config['server']['secret'], 'testing')
})
