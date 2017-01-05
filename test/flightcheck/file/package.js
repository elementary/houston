/**
 * test/flightcheck/file/package.js
 * Tests general Package class methods
 */

import path from 'path'
import test from 'ava'

import { mockConfig } from 'test/helpers'
import alias from 'root/.alias'

test.beforeEach('setup', (t) => {
  mockConfig()

  t.context.Package = require(path.resolve(alias.resolve.alias['flightcheck'], 'file', 'package')).default
})

test('able to create simple Package', (t) => {
  t.notThrows(() => new t.context.Package('testing', 'deb'))
  t.notThrows(() => new t.context.Package('testing', 'superawesomepack'))
  t.notThrows(() => new t.context.Package('testing', 'deb', 'amd64', 'xenial'))

  t.throws(() => new t.context.Package('testing'))
  t.throws(() => new t.context.Package('testing', 'n'))
})
