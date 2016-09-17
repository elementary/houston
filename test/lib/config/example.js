/**
 * test/lib/config/example.js
 * Tests the accuracty of configuration loading while checking example data
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from './fixtures/config'

test('config against example config for missing values', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)
  mock(path.resolve(alias.resolve.alias['root'], 'config.example.js'), Object.assign({}, mockConfig, {
    github: {
      example: 'this value will never exist in the configuration'
    }
  }))

  t.throws(() => require(path.resolve(alias.resolve.alias['lib'], 'config')).default)
})
