/**
 * test/houston/controller/api/error.js
 * Tests the JSON API error class
 */

import _ from 'lodash'
import test from 'ava'

import APIError from 'houston/controller/api/error'

test('inherits from Error class', (t) => {
  const one = new APIError(500, 'Server error')

  t.true(one instanceof Error)
})

test('can be created with optional details', (t) => {
  const one = new APIError(404, 'Page not found')
  const two = new APIError(500, 'Server error', 'please try again')

  t.is(one.status, 404)
  t.is(one.title, 'Page not found')
  t.true(one.detail == null)

  t.is(two.status, 500)
  t.is(two.title, 'Server error')
  t.is(two.detail, 'please try again')
})

test('can be created with pointer source', (t) => {
  const one = new APIError.FromPointer(500, 'Server error', '/data')

  t.is(one.status, 500)
  t.is(one.title, 'Server error')
  t.is(one.source['pointer'], '/data')
})

test('can be created with parameter source', (t) => {
  const one = new APIError.FromParameter(500, 'Server error', 'project')

  t.is(one.status, 500)
  t.is(one.title, 'Server error')
  t.is(one.source['parameter'], 'project')
})

test('toAPI follows JSON API formatting', (t) => {
  const one = new APIError(500, 'testing')
  const two = new APIError.FromParameter(500, 'testing', 'test')

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
