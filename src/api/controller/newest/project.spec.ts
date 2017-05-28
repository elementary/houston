/**
 * houston/src/api/controller/newest/project.spec.ts
 * Tests the endpoint for AppCenter's homepage banner. Kinda a big deal.
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

test('returns a 200 when viewing', () => {
  return supertest(server.http())
    .get('/newest/project')
    .expect(200)
})

test('returns an array of appstream values when viewing', async () => {
  const res = await supertest(server.http())
    .get('/newest/project')
    .expect(200)

  expect(res.body).toHaveProperty('data')
  expect(res.body.data).toHaveLength(3)
  expect(res.body.data[0]).toEqual(expect.stringMatching(/^.*\.desktop$/))
})
