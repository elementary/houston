/**
 * tests/houston/policy/ifRole.js
 * Tests ifRole for security testing against user
 */

import chai from 'chai'

import ifRole from '~/houston/policy/ifRole'

const assert = chai.assert

describe('ifRole', () => {
  it('passes a valid user', (done) => {
    if (ifRole({ right: 'USER' }, 'USER')) {
      done()
    } else {
      done(new Error('passes valid request'))
    }
  })

  it('fails to pass invalid user', (done) => {
    if (ifRole({ right: 'USER' }, 'BETA')) {
      done(new Error('blocks invalid user'))
    } else {
      done()
    }
  })

  it('fails if user has invalid role', (done) => {
    if (ifRole({ right: 'DORK' }, 'BETA')) {
      done(new Error('blocks user with invalid right'))
    } else {
      done()
    }
  })

  it('throws error on code having invalid role', (done) => {
    assert.throws(() => {
      ifRole({ right: 'BETA' }, 'DORK')
    })
    done()
  })
})
