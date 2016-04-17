/**
 * tests/lib/config.js
 * Test config for accurate loading, and environment overriding
 */

import chai from 'chai'
import mock from 'mock-require'

const assert = chai.assert

describe('config', () => {
  afterEach((done) => {
    const files = [
      require.resolve('../mocks/config'),
      require.resolve('../../config.example.js'),
      require.resolve('../../lib/config')
    ]

    files.forEach((file) => {
      if (require.cache[file] != null) {
        delete require.cache[file]
      }
    })

    done()
  })

  it('loads configuration file', (done) => {
    mock('../../config', require('../mocks/config'))
    const config = require('../../lib/config').default

    assert.isObject(config, 'returns an object')
    assert.lengthOf(Object.keys(config), 10, 'has correct length')
    assert.propertyVal(config, 'database', 'mongodb://localhost/houston-test', 'correct database')
    assert.deepPropertyVal(config, 'server.secret', 'ermagerditsasecretsodonttellanyone', 'correct server secret')
    assert.deepProperty(config, 'houston.version', 'has package version')
    done()
  })

  it('uses environment settings if set', (done) => {
    mock('../../config', require('../mocks/config'))
    process.env.HOUSTON_SERVER_SECRET = 'testing'
    const config = require('../../lib/config').default

    assert.deepPropertyVal(config, 'server.secret', 'testing', 'uses variable')
    done()
  })

  it('does now throw error if path is false', (done) => {
    mock('../../config', Object.assign(require('../mocks/config'), {
      github: false
    }))
    mock('../../config.example.js', {
      github: {
        setting: 'you need this for github settings'
      }
    })

    assert.doesNotThrow(() => require('../../lib/config'), 'respects false attribute')
    done()
  })

  it('compares example configuration file', (done) => {
    mock('../../config', require('../mocks/config'))
    mock('../../config.example.js', {
      github: {
        coolnewsetting: 'something you dont have in your configuration file'
      }
    })

    assert.throws(() => require('../../lib/config'), 'Missing configuration in "config.js"', 'checks example config')
    done()
  })
})
