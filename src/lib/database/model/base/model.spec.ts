/**
 * houston/src/lib/database/model/base/model.spec.ts
 * Tests the master model class
 */

import { Model } from './model'

test('createId makes a uuid', () => {
  const id = Model.createId()
  const [one, two, three, four, five] = id.split('-')

  expect(id).toHaveLength(36)
  expect(one).toHaveLength(8)
  expect(two).toHaveLength(4)
  expect(three).toHaveLength(4)
  expect(four).toHaveLength(4)
  expect(five).toHaveLength(12)
})

test('cast from database converts underscored values to cammel case', () => {
  const test = Model.castFromDatabase({
    key: 'value',
    double_key: 'more values',
    triple_key_value: 'even more values'
  })

  expect(test).toHaveProperty('key')
  expect(test).toHaveProperty('doubleKey')
  expect(test).toHaveProperty('tripleKeyValue')

  expect(test.key).toEqual('value')
  expect(test.doubleKey).toEqual('more values')
  expect(test.tripleKeyValue).toEqual('even more values')
})

test('can create with no values', () => {
  const test = new Model()

  expect(test).toBeInstanceOf(Model)
})

test('can set values when creating object', () => {
  const test = new Model({
    key: 'value'
  })

  expect(test).toHaveProperty('key')
  expect(test.key).toEqual('value')
})
