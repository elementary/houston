/**
 * test/houston/policy/isRole.js
 * Tests isRole for security
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import isRole from 'houston/policy/isRole'
import mockConfig from './fixtures/config'

mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

test('returns an accurate function', (t) => {
  const one = isRole('USER')

  t.is(typeof one, 'function')

  t.notThrows(new Promise((resolve, reject) => {
    one({
      user: { right: 'USER' },
      isAuthenticated: () => true
    }, () => resolve())
  }))
})

test('does not allow invalid users', (t) => {
  const one = isRole('ADMIN')

  t.is(typeof one, 'function')

  t.throws(new Promise((resolve, reject) => {
    one({
      user: { right: 'USER' },
      isAuthenticated: () => true
    }, () => resolve())
  }))
})
