/**
 * houston/src/lib/queue/provider.spec.ts
 * Tests out the container system for the queue. I'm sorry am a IoC noob
 */

import { App } from '../app'
import { Config } from '../config'
import { Queue, workerQueue } from './index'

import { create } from '../../../test/utility/app'

let app: App

beforeEach(async () => {
  app = await create()
})

test('Queue throws error if configuration is unset', () => {
  const config = app.get<Config>(Config)

  config.unfreeze()
  config.set('queue.client', null)

  expect(app.get<Queue>(Queue)).toThrowError(/config/)
})

test('Queue resolves to a factory function', () => {
  const queue = app.get<Queue>(Queue)

  expect(typeof queue === 'function').toBeTruthy()
})

test('workerQueue is a resolved Queue instance', () => {
  const queue = app.get<Queue>(workerQueue)

  expect(typeof queue.send === 'function').toBeTruthy()
})
