/**
 * houston/test/spec/worker/log.ts
 * Tests the worker Log can do log related things :shrug:
 */

import test from 'ava'
import * as path from 'path'

import { Log } from '../../../src/worker/log'

test('it can render a template', (t) => {
  const test1 = path.resolve(__dirname, '../../fixture/worker/log/test1.md')

  const log = Log.template(Log.Level.ERROR, test1, {
    body: '## This is a subheader',
    title: 'testing'
  })

  t.is(log.title, 'testing')
  t.is(log.body, 'This is a basic test1 Log template.\n\n## This is a subheader')
})

test('setError will change the error message', (t) => {
  const error = new Error('this is a test')

  const log = new Log(Log.Level.ERROR, 'test', 'body')
  log.setError(error)

  t.is(log.message, error.message)
})

test('setError will add error object to the log', (t) => {
  const error = new Error('this is a test')

  const log = new Log(Log.Level.ERROR, 'test', 'body')
  log.setError(error)

  t.is(log.error, error)
})

test('toString returns a nice templated log', (t) => {
  const err = new Log(Log.Level.ERROR, 'title', 'body')

  t.is(err.toString(), '# title\n\nbody')
})
