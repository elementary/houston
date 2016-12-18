/**
 * test/houston/policy/isRole.js
 * Tests isRole for security
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

test.beforeEach('setup configuration mock', (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)
  t.context.isRole = require(path.resolve(alias.resolve.alias['houston'], 'policy', 'isRole')).default
})

test('returns an accurate function', (t) => {
  const isRole = t.context.isRole

  const one = isRole('USER')

  t.is(typeof one, 'function')

  t.notThrows(new Promise((resolve, reject) => {
    one({
      state: { user: { right: 'USER' } },
      isAuthenticated: () => true
    }, () => resolve())
  }))
})

test('does not allow invalid users', (t) => {
  const isRole = t.context.isRole

  const one = isRole('ADMIN')

  t.is(typeof one, 'function')

  t.throws(new Promise((resolve, reject) => {
    one({
      state: { user: { right: 'USER' } },
      isAuthenticated: () => true
    }, () => resolve())
  }))
})
