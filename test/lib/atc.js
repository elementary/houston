/**
 * test/lib/atc.js
 * Tests the atc message queue
 */

import test from 'ava'
import path from 'path'

import { mockConfig } from 'test/helpers'
import alias from 'root/.alias'

test.beforeEach('setup configuration mock', async (t) => {
  mockConfig()

  t.context.atc = require(path.resolve(alias.resolve.alias['lib'], 'atc'))
  t.context.config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
})

test('Sender can create an item in the queue', async (t) => {
  const queue = new t.context.atc.Sender('test')

  const one = await queue.add('job', { value: 'one' })
  const two = await queue.add('job', { value: 'two' })

  t.is(one.name, 'job')
  t.deepEqual(one.params, { value: 'one' })
  t.is(two.name, 'job')
  t.deepEqual(two.params, { value: 'two' })
})

test('Sender can get an item in the queue', async (t) => {
  const queue = new t.context.atc.Sender('test')

  const one = await queue.add('job', { value: 'one' })

  t.false(one._id == null)

  const two = await queue.get(one._id)

  t.is(two.name, 'job')
  t.deepEqual(one.params, two.params)
})

test('Worker can register a function', async (t) => {
  const worker = new t.context.atc.Worker('test')

  t.notThrows(() => {
    worker.register('job', (param) => new Promise((resolve) => resolve()))
  })
})

test.cb('can send information between Sender and Worker', (t) => {
  const queue = new t.context.atc.Sender('newTest')
  const worker = new t.context.atc.Worker('newTest')

  const job = {
    one: 'one',
    two: 2
  }

  // use async to create a lazy promise
  worker.register('job', async (param) => {
    t.deepEqual(param, job)
    return new Promise((resolve) => resolve(param))
  })

  worker.on('complete', (j) => {
    t.deepEqual(j.params, job)
    t.end()
  })
  worker.on('error', (err) => {
    throw err
  })
  worker.on('failed', (d) => {
    throw new Error('test failed')
  })

  worker.start()

  queue.add('job', job)
})
