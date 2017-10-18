/**
 * houston/src/api/error/transform.spec.ts
 * Ensures we can convert any type of error something publicly showable.
 */

import * as Koa from 'koa'

import { Context as FakeContext } from '../../../test/utility/koa'
import { upsert } from '../../lib/utility'
import { BasicApiError } from './error'
import { transform } from './transform'

test('a standard error returns a 500 code', () => {
  const before = new Error()
  const after = transform(before)

  expect(after.httpStatus).toEqual(500)
})

test('an BasicApiError can pass without being transformed', () => {
  const before = new BasicApiError(404, 'Page Not Found')
  const after = transform(before)

  expect(after.httpStatus).toEqual(404)
})

test('adds an ApiRender function to standard errors', async () => {
  const before = new Error()
  const after = transform(before)
  const ctx = FakeContext()

  await after.apiRender(ctx)

  expect(ctx.response.status).toEqual(500)
  expect(ctx.response.body).toHaveProperty('errors', [{
    status: 500,
    title: 'Error'
  }])
})

test('does not touch any already set render function', async () => {
  const before = new BasicApiError(400)
  before.apiRender = async (ctx: Koa.Context) => {
    ctx.status = 400

    upsert(ctx.response, 'body.errors', [{
      extrasupermessage: 'woooooop'
    }])
  }

  const after = transform(before)
  const ctx = FakeContext()
  await after.apiRender(ctx)

  expect(ctx.response.status).toEqual(400)
  expect(ctx.response.body).toHaveProperty('errors', [{
    extrasupermessage: 'woooooop'
  }])
})
