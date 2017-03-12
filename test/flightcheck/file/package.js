/**
 * test/flightcheck/file/package.js
 * Tests general Package class methods
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

test.beforeEach('setup', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.Package = require(path.resolve(alias.resolve.alias['flightcheck'], 'file', 'package')).default
})

test('able to create simple Package', (t) => {
  t.notThrows(() => new t.context.Package('testing.deb', undefined, 'deb'))
  t.notThrows(() => new t.context.Package('testing.deb'))
  t.notThrows(() => new t.context.Package('testing.deb', undefined, 'amd64', 'xenial'))
})
