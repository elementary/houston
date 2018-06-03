/**
 * houston/src/worker/log.spec.ts
 * Tests the worker Log can do log related things :shrug:
 */

import * as path from 'path'

import { Log } from './log'

test('it can render a template', () => {
  const template = path.resolve(__dirname, '../../test/fixture/worker/log/test1.md')
  const log = Log.template(Log.Level.ERROR, template, {
    body: '## This is a subheader',
    title: 'testing'
  })

  expect(log.title).toBe('testing')
  expect(log.body).toBe('This is a basic test1 Log template.\n\n## This is a subheader')
})

test('toString returns a nice templated log', () => {
  const log = new Log(Log.Level.ERROR, 'title', 'body')
  const str = log.toString()

  expect(str).toMatch(/# title/)
  expect(str).toMatch(/body/)
})

test('toString outputs error message and stack', () => {
  const error = new Error('testing error')
  const log = new Log(Log.Level.ERROR, 'title').setError(error)
  const str = log.toString()

  expect(str).toMatch(/# title/)
  expect(str).toMatch(/testing error/)
  expect(str).toMatch(/log\.spec\.ts/)
})
