/**
 * test/houston/policy/ifRole.js
 * Tests ifRole for security
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import ifRole from 'houston/policy/ifRole'
import mockConfig from './fixtures/config'

mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

test('authenticates based on right', (t) => {
  const one = ifRole({ right: 'USER' }, 'USER')
  const two = ifRole({ right: 'BETA' }, 'USER')
  const three = ifRole({ right: 'ADMIN' }, 'USER')
  const four = ifRole({ right: 'USER' }, 'BETA')
  const five = ifRole({ right: 'REVIEW' }, 'ADMIN')

  t.true(one)
  t.true(two)
  t.true(three)
  t.false(four)
  t.false(five)
})

test('returns false on invalid user', (t) => {
  const one = ifRole({ right: 'DORK' }, 'USER')
  const two = ifRole({ right: 'ADMIM' }, 'ADMIN')

  t.false(one)
  t.false(two)
})

test('fails on invalid code', (t) => {
  t.throws(() => ifRole({ right: 'BETA' }, 'DORK'))
  t.throws(() => ifRole({ right: 'ADMIN' }, 'REGULAR'))
})
