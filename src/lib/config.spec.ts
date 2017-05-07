/**
 * houston/src/lib/config.spec.ts
 * Tests the configuration class
 */

import { Config } from './config'

test('can be created with an object', () => {
  const config = new Config({
    key: 'value'
  })

  expect(config.tree.key, 'value')
})

test('can get a value', () => {
  const config = new Config({
    key: 'value'
  })

  expect(config.get('key'), 'value')
  expect(config.get('noop')).toBeUndefined()
})

test('get uses a default value', () => {
  const config = new Config({
    key: 'value'
  })

  expect(config.get('noop', 'value'), 'value')
  expect(config.get('key', 'invalid'), 'value')
})

test('has returns boolean for existing value', () => {
  const config = new Config({
    key: 'value'
  })

  expect(config.get('key')).toBeTruthy()
  expect(config.get('noop')).toBeFalsy()
})

test('set sets new values', () => {
  const config = new Config()

  config.set('key', 'value')
  expect(config.tree.key, 'value')
})

test('set sets nested values', () => {
  const config = new Config()

  config.set('key.nested', 'value')
  expect(config.tree.key.nested, 'value')
})

test('merge sets values', () => {
  const config = new Config({
    key: 'value'
  })

  config.merge({
    key: {
      nested: 'value'
    }
  })

  expect(config.tree.key.nested, 'value')
})

test('freeze makes the config immutable', () => {
  const config = new Config({
    key: 'value'
  })

  config.freeze()
  expect(config.immutable).toBeTruthy()

  expect(() => {
    config.tree.key = 'bad'
  }).toThrowError(/read\sonly/)
})

test('unfreeze makes the config editable', () => {
  const config = new Config({
    key: 'value'
  })

  Object.freeze(config.tree)

  config.unfreeze()
  expect(config.immutable).toBeFalsy()

  config.tree.key = 'good'
  expect(config.tree.key, 'good')
})
