/**
 * houston/src/api/error/error.spec.ts
 * Tests the super basic http error. Mostly for coverage, but hey, can't be too careful.
 */

import { Context as FakeContext } from '../../../test/utility/koa'
import { BasicApiError } from './error'

test('defaults to a basic 500 error', () => {
  const error = new BasicApiError()

  expect(error.httpStatus).toEqual(500)
})

test('can set properties from constructor', () => {
  const error = new BasicApiError(404, 'Page Not Found')

  expect(error.httpStatus).toEqual(404)
  expect(error.httpMessage).toEqual('Page Not Found')
})

test('default render function sets status and sane message', async () => {
  const error = new BasicApiError(418, 'Im a problem')

  const ctx = FakeContext()
  await error.httpRender(ctx)

  expect(ctx.status).toEqual(418)
  expect(ctx.body).toContain(418)
  expect(ctx.body).toContain('Im a problem')
})
