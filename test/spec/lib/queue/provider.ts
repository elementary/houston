/**
 * houston/test/spec/lib/queue/provider.ts
 * Tests out the container system for the queue. I'm sorry am a IoC noob
 */

import { test as baseTest, TestInterface } from 'ava'

import { App } from '../../../../src/lib/app'
import { Config } from '../../../../src/lib/config'
import { IQueue, IQueueConstructor, Queue, workerQueue } from '../../../../src/lib/queue'

import { create } from '../../../utility/app'

const test = baseTest as TestInterface<{
  app: App
}>

test.beforeEach('setup app container', async (t) => {
  t.context.app = await create()
})

test('Queue throws error if configuration is unset', (t) => {
  const { app } = t.context
  const config = app.get<Config>(Config)
  const queueFactory = app.get<IQueueConstructor>(Queue)

  config.unfreeze()
  config.set('queue.client', null)

  t.throws(() => queueFactory('testing'), /config/)
})

test('Queue resolves to a factory function', (t) => {
  const { app } = t.context
  const queueFactory = app.get<IQueueConstructor>(Queue)

  t.is(typeof queueFactory, 'function')
})

test('workerQueue is a resolved Queue instance', (t) => {
  const { app } = t.context
  const queue = app.get<IQueue>(workerQueue)

  t.is(typeof queue.send, 'function')
})
