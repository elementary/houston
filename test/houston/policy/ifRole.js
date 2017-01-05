/**
 * test/houston/policy/ifRole.js
 * Tests ifRole for security
 */

import path from 'path'
import test from 'ava'

import { mockConfig } from 'test/helpers'
import alias from 'root/.alias'

test.beforeEach('setup configuration mock', (t) => {
  mockConfig()

  t.context.ifRole = require(path.resolve(alias.resolve.alias['houston'], 'policy', 'ifRole')).default
})

test('authenticates based on right', (t) => {
  const ifRole = t.context.ifRole

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
  const ifRole = t.context.ifRole

  t.false(ifRole({ right: 'DORK' }, 'USER'))
  t.false(ifRole({ right: 'ADMIM' }, 'ADMIN'))
})

test('returns false on invalid code', (t) => {
  const ifRole = t.context.ifRole

  t.false(ifRole({ right: 'BETA' }, 'DORK'))
  t.false(ifRole({ right: 'ADMIN' }, 'REGULAR'))
})
