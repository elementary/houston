/**
 * tests/core/index.js
 * Test all core items
 */

import Proxyquire from 'proxyquire'
import Request from 'supertest'

const config = Proxyquire('../../app.js', {
  './config.js': Object.assign(require('../mocks/MCP.js'), {'@global': true})
}).Config

const server = Proxyquire('../../master.js', {
  './config.js': Object.assign(require('../mocks/MCP.js'), {'@global': true})
}).Server

const request = Request(config.server.url)

describe('core controllers', () => {
  beforeEach((done) => {
    server.listen(config.server.port)
    done()
  })

  afterEach((done) => {
    server.close()
    done()
  })

  it('access homepage', (done) => {
    request
    .get('/')
    .set('Accept', 'text/html')
    .expect('Content-Type', /html/)
    .expect(200)
    .end(done)
  })
})
