/**
 * houston/src/api/controller/newest/project.e2e.ts
 * Tests the endpoint for AppCenter's homepage banner. Kinda a big deal.
 */

import * as supertest from 'supertest'

import { create } from '../../../../test/utility/app'
import { Context as FakeContext } from '../../../../test/utility/koa'

import { App } from '../../../lib/app'
import { Database } from '../../../lib/database'
import { NewestProjectController } from './project'

let app: App
let database: Database
let controller: NewestProjectController

beforeEach(async () => {
  app = await create()
  database = app.get<Database>(Database)

  await database.knex.migrate.latest()
  await database.knex.seed.run()

  controller = new NewestProjectController(database)
})

test.skip('returns correct apps from view', async () => {
  const ctx = FakeContext()

  await controller.view(ctx)

  expect(ctx.response.body).toHaveProperty('data')
  expect(ctx.response.body.data).toHaveLength(3)
  expect(ctx.response.body.data).toEqual([
    'com.github.elementary.terminal.desktop',
    'com.github.elementary.appcenter.desktop',
    'com.github.btkostner.keymaker.desktop'
  ])
})
