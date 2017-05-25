/**
 * houston/src/lib/server/errorConverter.spec.ts
 * Tests that no errors are leaked to the client
 */

import { convertError } from './errorConverter'
import { ServerError } from './error'

test('it converts a regular error to a basic 500 error', () => {
  const error = new Error('some weird info here')
  const serverError = convertError(error)

  expect(serverError).toBeInstanceOf(ServerError)
  expect(serverError.message).not.toEqual(error.message)
  expect(serverError.status).toEqual(500)
})

test('it returns ServerErrors untouched', () => {
  const error = new ServerError('Page Not Found', 404)
  const serverError = convertError(error)

  expect(error).toEqual(serverError)
})
