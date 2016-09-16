/**
 * test/houston/policy/isRole.js
 * Tests isRole for security
 */

import test from 'ava'

import isRole from '~/houston/policy/isRole'

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
