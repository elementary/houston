/**
 * houston/src/api/middleware/checkHeaders.ts
 * Checks headers for the needed json api spec
 */

import { Context } from 'koa'

import { create } from '../../../test/utility/app'
import { Context as FakeContext } from '../../../test/utility/koa'

import { Config } from '../../lib/config'
import { setResponse } from './setResponse'

let config: Config

beforeEach(async () => {
  const app = await create()
  config = app.get<Config>(Config)
})

const next = async (ctx: Context) => {
  ctx.status = 200
}

test('sets an empty body', async () => {
  const middleware = setResponse(config)
  const ctx = FakeContext()

  await middleware(ctx, next)

  return expect(ctx.response.body).toMatchObject({})
})

test('sets response type', async () => {
  const middleware = setResponse(config)
  const ctx = FakeContext()

  await middleware(ctx, next)

  return expect(ctx.response.type).toBe('application/vnd.api+json')
})

test('sets the configuration environment', async () => {
  config
    .unfreeze()
    .set('houston.environment', 'noop')
    .freeze()

  const middleware = setResponse(config)
  const ctx = FakeContext()

  await middleware(ctx, next)

  return expect(ctx.response.body.meta.environment).toBe('noop')
})

test('sets the houston version', async () => {
  const middleware = setResponse(config)
  const ctx = FakeContext()

  await middleware(ctx, next)

  const version = config.get('houston.commit', config.get('houston.version'))

  return expect(ctx.response.body.meta.version).toBe(version)
})

test('sets the json API version', async () => {
  const middleware = setResponse(config)
  const ctx = FakeContext()

  await middleware(ctx, next)

  return expect(ctx.response.body.jsonapi.version).toBe('1.0')
})
