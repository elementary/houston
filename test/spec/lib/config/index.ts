/**
 * houston/test/spec/lib/config/index.ts
 * Tests the configuration class
 */

import { test } from 'ava'

import { Config } from '../../../../src/lib/config/index'

test('can be created with an object', (t) => {
  const config = new Config({
    key: 'value'
  })

  t.is(config.get('key'), 'value')
})

test('can get a value', (t) => {
  const config = new Config({
    key: 'value'
  })

  t.is(config.get('key'), 'value')
  t.is(config.get('noop'), undefined)
})

test('get uses a default value', (t) => {
  const config = new Config({
    key: 'value'
  })

  t.is(config.get('noop', 'value'), 'value')
  t.is(config.get('key', 'invalid'), 'value')
})

test('has returns boolean for existing value', (t) => {
  const config = new Config({
    key: 'value'
  })

  t.true(config.has('key'))
  t.false(config.has('noop'))
})

test('set sets new values', (t) => {
  const config = new Config()

  config.set('key', 'value')

  t.is(config.get('key'), 'value')
})

test('set sets nested values', (t) => {
  const config = new Config()

  config.set('key.nested', 'value')

  t.is(config.get('key.nested'), 'value')
})

test('merge sets values', (t) => {
  const config = new Config({
    key: 'value'
  })

  config.merge({
    key: {
      nested: 'value'
    }
  })

  t.is(config.get('key.nested'), 'value')
})

test('freeze makes the config immutable', (t) => {
  const config = new Config({
    key: 'value'
  })

  config.freeze()

  t.throws(() => config.set('key', 'bad'), /immutable/)
})

test('unfreeze makes the config editable', (t) => {
  const config = new Config({
    key: 'value'
  })

  config.unfreeze()

  t.notThrows(() => config.set('key', 'good'))
})

test('freeze does not mess up with a null value', (t) => {
  const config = new Config({
    key: null
  })

  config.freeze()

  t.throws(() => config.set('key', 'bad'), /immutable/)
})

test('merge fails on immutable tree', (t) => {
  const config = new Config({
    key: 'value'
  })

  config.freeze()

  t.throws(() => config.merge({ more: 'value' }), /immutable/)
})
