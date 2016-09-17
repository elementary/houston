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

test('uses environment settings', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  const config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default

  t.is(config['server']['secret'], 'testing')
})
