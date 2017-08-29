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

test('log can set level', () => {
  const log = new Log(logger)
    .setLevel(Level.ERROR)

  expect(log.level).toEqual(Level.ERROR)
})

test('log can set message', () => {
  const log = new Log(logger)
    .setMessage('testing log message')

  expect(log.message).toEqual('testing log message')
})

test('log can attach arbitrary data to error', () => {
  const log = new Log(logger)
    .setData('user', 'me!')

  expect(log.data.user).toEqual('me!')
})

test('log can attach an error', () => {
  const error = new Error('testing')
  const log = new Log(logger)
    .setError(error)

  expect(log.error).toEqual(error)
})

test('log sets date on creation', () => {
  const log = new Log(logger)

  expect(typeof log.getDate(), 'Date')
})
