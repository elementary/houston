/**
 * test/lib/helper/dotNotation.js
 * Tests dotNotation for accurate transform between dot notation and expanded
 */

import test from 'ava'

import * as dot from 'lib/helpers/dotNotation'

test('transforms expanded to dot', (t) => {
  const one = dot.toDot({
    key1: 'value1',
    key2: 'value2',
    key3: {
      key4: 'value3',
      key5: 'value4',
      key6: {
        key7: 'value5',
        key8: 'value6'
      },
      key9: 'value7',
      key10: ['value8', 'value8.5']
    },
    key11: 9
  })

  t.is(typeof one, 'object')
  t.is(Object.keys(one).length, 9)

  t.is(one['key2'], 'value2')
  t.is(one['key3.key6.key7'], 'value5')
  t.is(one['key3.key9'], 'value7')
  t.deepEqual(one['key3.key10'], ['value8', 'value8.5'])
  t.is(one['key11'], 9)
})

test('can transform to expanded', (t) => {
  const one = dot.toObj({
    'key1': 'value1',
    'key2': 'value2',
    'key3.key4': 'value3',
    'key3.key5': 'value4',
    'key3.key6.key7': 'value5',
    'key3.key6.key8': 'value6',
    'key3.key9': 'value7',
    'key3.key10': ['value8', 'value8.5'],
    'key11': 9
  })

  t.is(typeof one, 'object')
  t.is(Object.keys(one).length, 4)

  t.is(one['key2'], 'value2')
  t.is(one['key3']['key6']['key7'], 'value5')
  t.is(one['key3']['key9'], 'value7')
  t.is(typeof one['key3']['key10'], 'object')
  t.is(one['key11'], 9)
})

test('dotNotation can use a unique seperator transforming to dot', (t) => {
  const one = dot.toDot({
    key1: 'value1',
    key2: {
      key3: 'value2',
      key4: 'value3'
    }
  }, '_')

  t.is(one['key1'], 'value1')
  t.is(one['key2_key3'], 'value2')
  t.is(one['key2_key4'], 'value3')
})

test('dotNotation can use a unique seperator transforming to expanded', (t) => {
  const one = dot.toObj({
    'key1': 'value1',
    'key2_key3': 'value2',
    'key2_key4': 'value3'
  }, '_')

  t.is(one['key1'], 'value1')
  t.is(one['key2']['key3'], 'value2')
  t.is(one['key2']['key4'], 'value3')
})
