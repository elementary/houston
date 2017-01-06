/**
 * test/houston/policy/isRole.js
 * Tests isRole for security
 */

import path from 'path'
import test from 'ava'

import { mockConfig } from 'test/helpers'
import alias from 'root/.alias'

test.beforeEach('setup configuration mock', (t) => {
  mockConfig()

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
