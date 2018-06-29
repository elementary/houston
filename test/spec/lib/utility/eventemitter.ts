/**
 * houston/test/spec/lib/utility/eventemitter.ts
 * Tests we can do the things we need to do in fun node event like fashion
 */

import { test } from 'ava'

import { EventEmitter } from '../../../../src/lib/utility/eventemitter'

test('it can modify a value with sync listeners', async (t) => {
  const em = new EventEmitter()

  em.on('test', (v) => (v + 2))

  const value = await em.emitAsyncChain('test', 1)

  t.is(value, 3)
})

test('it can modify a value with async listeners', async (t) => {
  const em = new EventEmitter()

  em.on('test', async (v) => (v + 1))
  em.on('test', async (v) => (v + 2))

  const value = await em.emitAsyncChain('test', 1)

  t.is(value, 4)
})

test('thrown errors in listeners appear on emitter', async (t) => {
  const em = new EventEmitter()

  const err = new Error('this is an error!')

  em.on('test', async (v) => (v + 1))
  em.on('test', async (v) => { throw err })

  await t.throws(em.emitAsyncChain('test', 1), err.message)
})
