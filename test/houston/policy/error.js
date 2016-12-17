/**
 * test/houston/policy/error.js
 * Tests the houston policy error class
 */

import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

const fakeUserOne = {
  username: 'pleb',
  email: 'pleb@me.com',
  right: 'USER'
}

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.PermError = require(path.resolve(alias.resolve.alias['houston'], 'policy', 'error')).default
})

test('inherits from Error class', (t) => {
  const one = new t.context.PermError(fakeUserOne, 'BETA')

  t.true(one instanceof Error)
})

test('has no specific error on creation', (t) => {
  const one = new t.context.PermError(fakeUserOne)

  t.false(one.needsRight)
  t.false(one.needsAgreement)
  t.false(one.needsAccess)
})

test('FromRight creates a new PermError', (t) => {
  const one = new t.context.PermError.FromRight(fakeUserOne, 'ADMIN')

  t.is(one.needsRight, 'ADMIN')
  t.false(one.needsAgreement)
  t.false(one.needsAccess)
})

test('FromAgreement creates a new PermError', (t) => {
  const one = new t.context.PermError.FromAgreement(fakeUserOne)

  t.false(one.needsRight)
  t.true(one.needsAgreement)
  t.false(one.needsAccess)
})

test('FromAccess creates a new PermError', (t) => {
  const one = new t.context.PermError.FromAccess(fakeUserOne)

  t.false(one.needsRight)
  t.false(one.needsAgreement)
  t.true(one.needsAccess)
})

test('PermError returns correct error code', (t) => {
  const one = new t.context.PermError(fakeUserOne)
  const two = new t.context.PermError(fakeUserOne)
  const three = new t.context.PermError(fakeUserOne)
  const four = new t.context.PermError(fakeUserOne)

  one.needsRight = true
  two.needsAgreement = true
  three.needsAccess = true

  t.is(one.code, 'PERMERRRGT')
  t.is(two.code, 'PERMERRAGR')
  t.is(three.code, 'PERMERRACC')
  t.is(four.code, 'PERMERR')
})
