/**
 * tests/core/index.js
 * Test all core items
 */

import Mock from 'mock-require'
import Request from 'supertest'
import Nock from 'nock'
import Chai from 'chai'

Mock('../../config.js', require('../mocks/MCP.js'))

const config = require('../../config.js')
const server = require('../../master.js').Server
const expect = Chai.expect
const request = Request(config.server.url)

describe('core controllers', () => {
  before(function (done) {
    server.listen(config.server.port)
    done()
  })

  after(function (done) {
    server.close()
    done()
  })

  afterEach(function (done) {
    Nock.cleanAll()
    Nock.restore()
    done()
  })

  it('can access homepage', function (done) {
    request
    .get('/')
    .set('Accept', 'text/html')
    .expect(200)
    .end(done)
  })

  it('has redirect login page', function (done) {
    request
    .get('/auth/github')
    .set('Accept', 'text/html')
    .expect(302)
    .expect((res) => {
      expect(res.header.location).contain('https://github.com/login/oauth/authorize')
      expect(res.header.location).contain(config.github.client)
    })
    .end(done)
  })

  it('dashboard requires login', function (done) {
    request
    .get('/dashboard')
    .set('Accept', 'text/html')
    .expect(302)
    .expect((res) => {
      expect(res.header.location).contain('/auth')
    })
    .end(done)
  })
})
