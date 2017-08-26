/**
 * houston/src/lib/log/log.spec.ts
 * Tests the log class.
 */

import { create } from '../../../test/utility/app'

import { App } from '../app'
import { Level } from './level'
import { Log } from './log'
import { Logger } from './logger'

let app: App
let logger: Logger

beforeEach(async () => {
  app = await create()
  logger = app.get<Logger>(Logger)
})

test('log can set level', async () => {
  const log = new Log(logger)
    .setLevel(Level.ERROR)

  expect(log.level).toEqual(Level.ERROR)
})

test('log can set message', async () => {
  const log = new Log(logger)
    .setMessage('testing log message')

  expect(log.message).toEqual('testing log message')
})

test('log can attach arbitrary data to error', async () => {
  const log = new Log(logger)
    .setData('user', 'me!')

  expect(log.data.user).toEqual('me!')
})

test('log can attach an error', async () => {
  const error = new Error('testing')
  const log = new Log(logger)
    .setError(error)

  expect(log.error).toEqual(error)
})

test('log sets date on creation', async () => {
  const log = new Log(logger)

  expect(typeof log.getDate(), 'Date')
})
