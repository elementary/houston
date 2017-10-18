/**
 * houston/src/lib/server/middleware/report.spec.ts
 * Checks that errors are handled as needed
 */

import { Context } from 'koa'
import { Context as FakeContext } from '../../../test/utility/koa'

import { report } from './report'

test('sets status to 500', async () => {
  const ctx = FakeContext()

  const next = async (c: Context) => {
    throw new Error('this is a basic error')
  }

  await report(ctx, next)

  return expect(ctx.status).toBe(500)
})

test('does not leak stack trace', async () => {
  const ctx = FakeContext()

  const next = async (c: Context) => {
    throw new Error('this is a basic error')
  }

  await report(ctx, next)

  expect(ctx.response.body.errors[0].title || '').not.toMatch('basic error')
  expect(ctx.response.body.errors[0].detail || '').not.toMatch('basic error')
})
