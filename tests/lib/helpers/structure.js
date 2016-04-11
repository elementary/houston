/**
 * tests/lib/helpers/structure.js
 * Test structure functions
 */

import chai from 'chai'

import * as structure from '~/lib/helpers/structure'

const assert = chai.assert

describe('structure', () => {
  it('can flatten object by function', (done) => {
    const obj = {
      num1: 123,
      obj1: {
        num2: 456,
        str1: 'thingadoo',
        arr1: []
      },
      arr2: [],
      obj2: {
        obj3: {
          obj4: {
            num3: 789
          }
        }
      }
    }

    const nums = structure.flatten(obj, (blob) => {
      return (typeof blob === 'number')
    })
    const strings = structure.flatten(obj, (blob) => {
      return (typeof blob === 'string')
    })
    const obj4 = structure.flatten(obj, (blob) => {
      return (typeof blob['num3'] === 'number')
    })

    assert.deepEqual(nums, [123, 456, 789], 'typeof number function works')
    assert.deepEqual(strings, ['thingadoo'], 'typeof string function works')
    assert.deepEqual(obj4, [{num3: 789}], 'typeof nested object')
    done()
  })
})
