/**
 * test/houston/controller/api/error.js
 * Tests the JSON API error class
 */

import _ from 'lodash'
import mock from 'mock-require'
import path from 'path'
import test from 'ava'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

test.beforeEach((t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  t.context.APIError = require(path.resolve(alias.resolve.alias['houston'], 'controller', 'api', 'error')).default
})

test('inherits from Error class', (t) => {
  const one = new t.context.APIError(500, 'Server error')

  t.true(one instanceof Error)
})

test('can be created with optional details', (t) => {
  const one = new t.context.APIError(404, 'Page not found')
  const two = new t.context.APIError(500, 'Server error', 'please try again')

  t.is(one.status, 404)
  t.is(one.title, 'Page not found')
  t.true(one.detail == null)

  t.is(two.status, 500)
  t.is(two.title, 'Server error')
  t.is(two.detail, 'please try again')
})

test('can be created with pointer source', (t) => {
  const one = new t.context.APIError.FromPointer(500, 'Server error', '/data')

  t.is(one.status, 500)
  t.is(one.title, 'Server error')
  t.is(one.source['pointer'], '/data')
})

test('can be created with parameter source', (t) => {
  const one = new t.context.APIError.FromParameter(500, 'Server error', 'project')

  t.is(one.status, 500)
  t.is(one.title, 'Server error')
  t.is(one.source['parameter'], 'project')
})

test('toAPI follows JSON API formatting', (t) => {
  const one = new t.context.APIError(500, 'testing')
  const two = new t.context.APIError.FromParameter(500, 'testing', 'test')

  const three = one.toAPI()
  const four = two.toAPI()

  const rootKeys = [
    'id',
    'links',
    'status',
    'code',
    'title',
    'detail',
    'source',
    'meta'
  ]

  t.is(_.pullAll(_.keys(three), rootKeys).length, 0)
  t.is(_.pullAll(_.keys(four), rootKeys).length, 0)
})
