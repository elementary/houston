/**
 * tests/houston/service/atc.js
 * Test houston atc server capatibility with lib/atc
 */

import chai from 'chai'
import http from 'http'

import config from '~/lib/config'
import atc from '~/houston/service/atc'
import Io from '~/lib/atc'

const assert = chai.assert

let httpServer
let io

describe('atc', () => {
  beforeEach((done) => {
    httpServer = http.createServer((req, res) => {
      res.send('ok')
    })

    atc.connect(httpServer)

    httpServer.listen(config.server.port, () => {
      io = new Io('flightcheck')
      io.connect(config.server.url)
      done()
    })
  })

  afterEach((done) => {
    httpServer.close()
    httpServer = null
    io = null
    done()
  })

  it('can receive messages from client', (done) => {
    atc.on('test1', (message) => {
      assert.equal(message, 'testing message to test things to', 'has correct message')
      done()
    })

    io.send('houston', 'test1', 'testing message to test things to')
  })

  it('emits a received event when client receives message', (done) => {
    io.on('test2:received', () => {
      done()
    })

    io.send('houston', 'test2', 'testing message to test things to')
  })
})
