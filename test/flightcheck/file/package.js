/**
 * test/flightcheck/file/package.js
 * Tests general Package class methods
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'
import Package from 'flightcheck/file/package'

test.beforeEach('setup', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)
})

test('able to create simple Package', (t) => {
  t.notThrows(() => new Package('testing', 'deb'))
  t.notThrows(() => new Package('testing', 'superawesomepack'))
  t.notThrows(() => new Package('testing', 'deb', 'amd64', 'xenial'))

  t.throws(() => new Package('testing'))
  t.throws(() => new Package('testing', 'n'))
})
