/**
 * houston/src/api/controller/newest/release.e2e.ts
 * Tests the endpoint for AppCenter's newest release scroller
 */

import * as supertest from 'supertest'

import { Api as Server } from '../../api'

import { setup as setupConfig } from '../../../../test/utility/config'
import { setup as setupDatabase } from '../../../../test/utility/database'

let config = null
let database = null
let server = null

beforeEach(async () => {
  config = await setupConfig()
  database = await setupDatabase(config)
  server = new Server(config, database)
})

afterEach(async () => {
  await server.close()
})

test('view', async () => {
  const res = await supertest(server.http())
    .get('/newest/release')
    .expect(200)

  expect(res.body).toHaveProperty('data')
  expect(res.body.data).toHaveLength(3)
  expect(res.body.data).toEqual([
    'com.github.elementary.appcenter.desktop',
    'com.github.btkostner.keymaker.desktop',
    'com.github.elementary.terminal.desktop'
  ])
})
