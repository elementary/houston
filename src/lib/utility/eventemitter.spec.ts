/**
 * houston/src/lib/utility/eventemitter.spec.ts
 * Tests we can do the things we need to do in fun node event like fashion
 */

import { EventEmitter } from './eventemitter'

test('it can modify a value with sync listeners', async () => {
  const em = new EventEmitter()

  em.on('test', (v) => (v + 2))

  const value = await em.emitAsyncChain('test', 1)

  expect(value).toBe(3)
})

test('it can modify a value with async listeners', async () => {
  const em = new EventEmitter()

  em.on('test', async (v) => (v + 1))
  em.on('test', async (v) => (v + 2))

  const value = await em.emitAsyncChain('test', 1)

  expect(value).toBe(4)
})

test('thrown errors in listeners appear on emitter', async () => {
  const em = new EventEmitter()

  const err = new Error('this is an error!')

  em.on('test', async (v) => (v + 1))
  em.on('test', async (v) => throw err)

  expect(em.emitAsyncChain('test', 1)).rejects.toEqual(err)
})
