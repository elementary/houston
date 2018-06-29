/**
 * houston/test/spec/lib/log/log.ts
 * Tests the log class.
 */

import { test as baseTest, TestInterface } from 'ava'
import { create } from '../../../utility/app'

import { App } from '../../../../src/app'
import { Level } from '../../../../src/lib/log/level'
import { Log } from '../../../../src/lib/log/log'
import { Logger } from '../../../../src/lib/log/logger'

const test = baseTest as TestInterface<{
  app: App,
  logger: Logger
}>

test.beforeEach(async (t) => {
  t.context.app = await create()
  t.context.logger = t.context.app.get<Logger>(Logger)
})

test('log can set level', (t) => {
  const log = new Log(t.context.logger)
    .setLevel(Level.ERROR)

  t.is(log.level, Level.ERROR)
})

test('log can set message', (t) => {
  const log = new Log(t.context.logger)
    .setMessage('testing log message')

  t.is(log.message, 'testing log message')
})

test('log can attach arbitrary data to error', (t) => {
  const log = new Log(t.context.logger)
    .setData('user', 'me!')

  t.deepEqual(log.data, { user: 'me!' })
})

test('log can attach an error', (t) => {
  const error = new Error('testing')
  const log = new Log(t.context.logger)
    .setError(error)

  t.is(log.error, error)
})

test('log sets date on creation', (t) => {
  const log = new Log(t.context.logger)

  t.true(log.getDate() instanceof Date)
})
