/**
 * test/lib/config/falsify.js
 * Tests the accuracty of configuration loading with parents being false
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from './fixtures/config'

test('false objects correctly', (t) => {
  mockConfig['aptly'] = false
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.notThrows(() => require(path.resolve(alias.resolve.alias['lib'], 'config')).default)
})
