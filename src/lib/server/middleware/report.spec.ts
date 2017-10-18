/**
 * houston/src/lib/server/middleware/report.spec.ts
 * Checks that errors are handled as needed
 */

import { Context } from 'koa'

import { create } from '../../../../test/utility/app'
import { Context as FakeContext } from '../../../../test/utility/koa'

import { Config } from '../../../lib/config'
import { report } from './report'

let config: Config

beforeEach(async () => {
  const app = await create()
  config = app.get<Config>(Config)
})

test('sets status to 500', async () => {
  const ctx = FakeContext()

  const next = async (c: Context) => {
    throw new Error('this is a basic error')
  }

  await report(config)(ctx, next)

  return expect(ctx.status).toBe(500)
})

test('does not leak stack trace', async () => {
  const ctx = FakeContext()

  const next = async (c: Context) => {
    throw new Error('this is a basic error')
  }

  await report(config)(ctx, next)

  expect(ctx.response.message).not.toMatch('basic error')
  expect(ctx.response.body || '').not.toMatch('basic error')
})
