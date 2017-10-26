/**
 * houston/src/api/controller/newest/release.e2e.ts
 * Tests the endpoint for AppCenter's homepage banner. Kinda a big deal.
 */

import * as supertest from 'supertest'

import { Config } from '../../../lib/config'

import { create } from '../../../../test/utility/app'
import { setup as setupDatabase } from '../../../../test/utility/database'
import { Context as FakeContext } from '../../../../test/utility/koa'

import { NewestReleaseController } from './release'

let database: Database

beforeEach(async () => {
  const app = await create()
  const config = app.get<Config>(Config)

  database = await setupDatabase(config)
})

test('returns correct apps from view', async () => {
  const controller = new NewestReleaseController(database)
  const ctx = FakeContext()

  await controller.view(ctx)

  expect(ctx.response.body).toHaveProperty('data')
  expect(ctx.response.body.data).toHaveLength(3)
  expect(ctx.response.body.data).toEqual([
    'com.github.elementary.appcenter.desktop',
    'com.github.btkostner.keymaker.desktop',
    'com.github.elementary.terminal.desktop'
  ])
})
