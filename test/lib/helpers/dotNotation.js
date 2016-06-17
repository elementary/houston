/**
 * tests/lib/helpers/dotNotation.js
 * Test dotNotation for accurate transform between dot notation and expanded form
 */

import chai from 'chai'

import * as dotNotation from '~/lib/helpers/dotNotation'

const assert = chai.assert

describe('dotNotation', () => {
  it('transforms expanded object to dot notation', (done) => {
    const dotForm = dotNotation.toDot({
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

    assert.isObject(dotForm, 'returns an object')
    assert.lengthOf(Object.keys(dotForm), 9, 'has correct length')
    assert.propertyVal(dotForm, 'key3.key6.key7', 'value5', 'iterates deeply')
    assert.propertyVal(dotForm, 'key2', 'value2', 'has correct value')
    assert.propertyVal(dotForm, 'key3.key9', 'value7', 'has correct value')
    assert.isArray(dotForm['key3.key10'], 'does not try to transform array')
    assert.isNumber(dotForm['key11'], 'does not try to transform number')
    done()
  })

  it('can use a unique seperator when transforming', (done) => {
    const dotForm = dotNotation.toDot({
      key1: 'value1',
      key2: {
        key3: 'value2',
        key4: 'value3'
      }
    }, '_')

    assert.propertyVal(dotForm, 'key1', 'value1', 'correctly converts to dot form')
    assert.propertyVal(dotForm, 'key2_key3', 'value2', 'correctly converts to dot form')
    assert.propertyVal(dotForm, 'key2_key4', 'value3', 'correctly converts to dot form')

    const objForm = dotNotation.toObj(dotForm, '_')

    assert.deepPropertyVal(objForm, 'key1', 'value1', 'correctly converts to expanded form')
    assert.deepPropertyVal(objForm, 'key2.key3', 'value2', 'correctly converts to expanded form')
    assert.deepPropertyVal(objForm, 'key2.key4', 'value3', 'correctly converts to expanded form')

    done()
  })

  it('transforms dot notation to expanded object', (done) => {
    const objForm = dotNotation.toObj({
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

    assert.isObject(objForm, 'returns an object')
    assert.lengthOf(Object.keys(objForm), 4, 'has correct length')
    assert.deepPropertyVal(objForm, 'key3.key6.key7', 'value5', 'iterates deeply')
    assert.deepPropertyVal(objForm, 'key2', 'value2', 'has correct value')
    assert.deepPropertyVal(objForm, 'key3.key9', 'value7', 'has correct value')
    assert.isArray(objForm.key3.key10, 'does not try to transform array')
    assert.isNumber(objForm.key11, 'does not try to transform number')
    done()
  })
})
