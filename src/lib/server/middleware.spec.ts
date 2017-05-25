/**
 * houston/src/lib/server/middleware.spec.ts
 * Tests the server middleware
 */

import { Log } from '../log'
import { ServerError } from './error'
import * as middleware from './middleware'
import { Server } from './server'

import { setup as setupConfig } from '../../../test/utility/config'

let config = null
let server = null

beforeEach(async () => {
  config = await setupConfig()
  server = new Server(config)
})

afterEach(async () => {
  await server.close()
})

test('onError logs all unknown errors as error level', () => {
  server.log = new Log(config)
  server.log.error = jest.fn()

  const fn = middleware.onError(server)

  fn(new Error('this is an error!'))

  expect(server.log.error.mock.calls).toHaveLength(1)
  expect(server.log.error.mock.calls[0][0]).toEqual('this is an error!')
  expect(server.log.error.mock.calls[0][1]).toMatchObject({})
})

test('onError logs all ServerError 500 or greater as error', () => {
  server.log = new Log(config)
  server.log.error = jest.fn()

  const fn = middleware.onError(server)

  fn(new ServerError('this is an error!', 500))

  expect(server.log.error.mock.calls).toHaveLength(1)
  expect(server.log.error.mock.calls[0][0]).toEqual('this is an error!')
  expect(server.log.error.mock.calls[0][1]).toHaveProperty('status')
  expect(server.log.error.mock.calls[0][1].status).toEqual(500)
})

test('onError logs all ServerError less than 500 as debug messages', () => {
  server.log = new Log(config)
  server.log.debug = jest.fn()

  const fn = middleware.onError(server)

  fn(new ServerError('this is an error!', 404))

  expect(server.log.debug.mock.calls).toHaveLength(1)
  expect(server.log.debug.mock.calls[0][0]).toEqual('this is an error!')
})
