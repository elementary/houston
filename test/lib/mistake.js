/**
 * tests/lib/mistake.js
 * Test mistake class errors
 */

import chai from 'chai'

import Mistake from '~/lib/mistake'

const assert = chai.assert

describe('mistake', () => {
  it('is an error', (done) => {
    const ohno = new Mistake(500, 'things happend')

    assert.instanceOf(ohno, Error, 'instance of error')
    done()
  })

  it('sets expose accuratly', (done) => {
    const ohno = new Mistake(500, 'bad things')
    const ohwell = new Mistake(404, 'page not found')
    const codered = new Mistake(999, 'end of line')

    assert.isFalse(ohno.expose, '500 errors are not exposed')
    assert.isTrue(ohwell.expose, '404 errors are exposed')
    assert.isFalse(codered.expose, '999 errors are not exposed')
    done()
  })

  it('appropriately uses given errors', (done) => {
    const original = new Error('bad things happend with this outside error')
    const mistake = new Mistake(500, 'bad things', original)

    assert.equal(mistake.message, 'bad things', 'uses new message')
    assert.equal(original.stack, mistake.stack, 'uses sent stacks')
    done()
  })

  it('does not care about order or what is given', (done) => {
    const original = new Error('bad things happend with this outside error')
    const test1 = new Mistake(101, 'bad things', original)
    const test2 = new Mistake('bad things', original, true)
    const test3 = new Mistake(original, 499, 'bad things', false)
    const test4 = new Mistake(500, true, original)

    assert.equal(test1.status, 101, 'uses first given status')
    assert.equal(test1.message, 'bad things', 'uses first given message')
    assert.equal(test1.stack, original.stack, 'uses error stack')
    assert.equal(test2.message, 'bad things', 'uses first given message')
    assert.equal(test2.stack, original.stack, 'uses error stack')
    assert.isTrue(test2.expose, 'uses expose boolean')
    assert.equal(test3.stack, original.stack, 'uses error stack')
    assert.equal(test3.status, 499, 'uses new status')
    assert.equal(test3.message, 'bad things', 'uses new message')
    assert.isFalse(test3.expose, 'uses expose boolean for status < 500')
    assert.equal(test4.status, 500, 'uses new status')
    assert.isTrue(test4.expose, 'uses expose boolean for status > 500')
    assert.equal(test4.stack, original.stack, 'uses error stack')
    assert.equal(test4.message, original.message, 'uses error message')
    done()
  })
})
