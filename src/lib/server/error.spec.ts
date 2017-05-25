/**
 * houston/src/lib/server/error.spec.ts
 * Tests that the server errors work as intended.
 */

import * as errors from './error'

test('ServerError has a 500 default status', async () => {
  const error = new errors.ServerError('this is an error')

  expect(error.status).toEqual(500)
})

test('ParameterError assigns properties correctly', async () => {
  const error = new errors.ParameterError('this is an error', 'project', 404)

  expect(error.message).toEqual('this is an error')
  expect(error.parameter).toEqual('project')
  expect(error.status).toEqual(404)
})

test('AttributeError assigns properties correctly', async () => {
  const error = new errors.AttributeError('this is an error', '/data/attribute/project', 403)

  expect(error.message).toEqual('this is an error')
  expect(error.attribute).toEqual('/data/attribute/project')
  expect(error.status).toEqual(403)
})
