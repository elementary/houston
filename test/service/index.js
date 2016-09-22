/**
 * test/service/index.js
 * Tests common aspects of third party service files
 */

import test from 'ava'

import * as service from 'service'

test('ServiceError is an error', (t) => {
  const one = new service.ServiceError('testing')

  t.true(one instanceof Error)
})

test('ServiceError has correct error code', (t) => {
  const one = new service.ServiceError('testing')

  t.is(one.code, 'SRCERR')
})
