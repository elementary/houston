/**
 * test/lib/request.js
 * Tests request superagent functions
 */

import nock from 'nock'
import test from 'ava'

import * as request from 'lib/request'

test.beforeEach((t) => {
  nock.disableNetConnect()

  nock('http://nope.com')
  .post('/endpoint')
  .reply(200, {
    'key': 'value'
  })

  nock('http://nope.com')
  .post('/endpoint2')
  .reply(200, {
    'key': 'value2'
  })
})

test('Can prefix a domain url', async (t) => {
  const one = request.domain('http://nope.com')

  const two = await one.post('/endpoint')
  const three = await one.post('/endpoint2')

  t.is(two.body.key, 'value')
  t.is(three.body.key, 'value2')
})

test('Can use methods for each domain request', async (t) => {
  const one = request.domain('http://nope.com')
  .use((req) => {
    req.url = 'http://testing.com'
    return req
  })

  const two = one.post('/endpoint')
  const three = one.post('/endpoint2')

  t.is(two.url, 'http://testing.com')
  t.is(three.url, 'http://testing.com')
})

// TODO: add unit test for request pagination
// nock query does not work as intended and therefor cannot be used
// eslint-disable-next-line
test.todo('Can use pagination accurately')
