/**
 * tests/lib/helpers/lang.js
 * Test language capabilities
 */

import chai from 'chai'

import * as lang from '~/lib/helpers/lang'

const assert = chai.assert

describe('lang', () => {
  it('can convert based on array length', (done) => {
    const test1 = lang.s('all things to singular', 1)
    const test2 = lang.s('too many people', 1)
    const test3 = lang.s('person thing are cat dog', 2)
    const test4 = lang.s('the number in array', [1, 2, 3])

    assert.equal(test1, '1 all thing to singular')
    assert.equal(test2, '1 too many person')
    assert.equal(test3, '2 people things are cats dogs')
    assert.equal(test4, '3 the numbers in arrays')
    done()
  })
})
