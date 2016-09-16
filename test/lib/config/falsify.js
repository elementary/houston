/**
 * test/lib/config/falsify.js
 * Tests the accuracty of configuration loading with parents being false
 */

import test from 'ava'
import mock from 'mock-require'

import mockConfig from './fixtures/config'

test('false objects correctly', (t) => {
  mockConfig['aptly'] = false
  mock('../../../config', mockConfig)

  t.notThrows(() => require('../../../src/lib/config').default)
})
