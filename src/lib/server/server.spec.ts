/**
 * houston/src/lib/server/server.spec.ts
 * Tests that the web server does what it needs to.
 */

import * as supertest from 'supertest'

import { create } from '../../../test/utility/app'

import { App } from '../app'
import { Server } from './server'

let app: App
let server: Server

beforeEach(async () => {
  app = await create()
  server = app.get<Server>(Server)
})

afterEach(() => {
  return server.close()
})

test('can listen on random port', () => {
  return server.listen(0)
})

test('http function returns a server for testing on', () => {
  return supertest(server.http())
    .get('/')
    .expect(404)
})
