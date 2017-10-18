/**
 * houston/src/lib/server/error/transform.spec.ts
 * Ensures we can convert any type of error something publicly showable.
 */

import * as Koa from 'koa'

import { Context as FakeContext } from '../../../../test/utility/koa'
import { BasicHttpError } from './error'
import { transform } from './transform'

test('a standard error returns a 500 code', () => {
  const before = new Error()
  const after = transform(before)

  expect(after.httpStatus).toEqual(500)
})

test('an BasicHttpError can pass without being transformed', () => {
  const before = new BasicHttpError(404, 'Page Not Found')
  const after = transform(before)

  expect(after.httpStatus).toEqual(404)
})

test('adds a basic httpRender function to standard errors', async () => {
  const before = new Error()
  const after = transform(before)

  const ctx = FakeContext()
  await after.httpRender(ctx)

  expect(ctx.status).toEqual(500)
})

test('does not touch any already set render function', async () => {
  const before = new BasicHttpError(400)
  before.httpRender = async (ctx: Koa.Context) => {
    ctx.status = 400
    ctx.body = 'testing'
  }

  const after = transform(before)

  const ctx = FakeContext()
  await after.httpRender(ctx)

  expect(ctx.status).toEqual(400)
  expect(ctx.body).toEqual('testing')
})
