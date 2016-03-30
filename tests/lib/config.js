/**
 * tests/lib/config.js
 * Test config for accurate loading, and environment overriding
 */

import chai from 'chai'

const assert = chai.assert

describe('config', () => {
  beforeEach((done) => {
    process.env.NODE_ENV = 'production'
    done()
  })

  afterEach((done) => {
    process.env.NODE_ENV = 'test'
    done()
  })

  it('loads configuration file', (done) => {
    const config = require('../../lib/config')

    assert.isObject(config, 'returns an object')
    assert.lengthOf(Object.keys(config), 9, 'has correct length')
    assert.propertyVal(config, 'database', 'mongodb://localhost/houston-test', 'correct database')
    assert.deepPropertyVal(config, 'server.secret', 'ermagerditsasecretsodonttellanyone', 'correct server secret')
    done()
  })

  it('uses environment settings if set', (done) => {
    process.env.HOUSTON_SERVER_SECRET = 'testing'
    const config = require('../../lib/config')

    assert.deepPropertyVal(config, 'server.secret', 'testing', 'uses variable')

    delete process.env.HOUSTON_SERVER_SECRET
    done()
  })
})
