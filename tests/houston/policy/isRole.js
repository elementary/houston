/**
 * tests/houston/policy/isRole.js
 * Tests isRole for security testing against user
 */

import chai from 'chai'

import isRole from '~/houston/policy/isRole'

const assert = chai.assert

describe('isRole', () => {
  it('returns usable function', (done) => {
    const fn = isRole('USER')

    assert.isFunction(fn, 'returns a function')

    fn({
      user: { right: 'USER' },
      isAuthenticated: () => true
    }, () => {
      done()
    })
  })

  it('does not allow invalid user to pass', (done) => {
    const fn = isRole('ADMIN')

    assert.isFunction(fn, 'returns a function')
    assert.throws(() => {
      fn({
        user: { right: 'USER' },
        isAuthenticated: () => true
      }, () => {
        done('allows invalid user to pass')
      })
    })
    done()
  })
})
