/**
 * tests/lib/atc.js
 * Test atc library for socket connection
 */

import chai from 'chai'
import http from 'http'

import config from '~/lib/config'
import Atc from '~/lib/atc'

const assert = chai.assert

let httpServer
let io

describe('atc', () => {
  beforeEach((done) => {
    httpServer = http.createServer((req, res) => {
      res.send('ok')
    })

    io = require('socket.io')(httpServer)

    httpServer.listen(config.server.port, () => {
      done()
    })
  })

  afterEach((done) => {
    httpServer.close()
    httpServer = null
    io = null
    done()
  })

  it('can connect to socket session', (done) => {
    io.on('connection', (socket) => {
      done()
    })

    const con = new Atc('flightcheck')
    con.connect(config.server.url)
  })

  it('will establish a connection and send type', (done) => {
    io.on('connection', (socket) => {
      socket.on('atc:type', (type) => {
        assert.equal(type, 'flightcheck', 'has correct atc type on connect')
        done()
      })
    })

    const con = new Atc('flightcheck')
    con.connect(config.server.url)
  })

  it('will send a message', (done) => {
    io.on('connection', (socket) => {
      socket.on('msg:send', (subject, message) => {
        assert.equal(subject, 'testing', 'has correct subject')
        assert.equal(message, 'a testing message to test from', 'has correct message')
        done()
      })
    })

    const con = new Atc('flightcheck')
    con.connect(config.server.url)
    con.send('houston', 'testing', 'a testing message to test from')
    .catch(done)
  })

  it('will queue a message and send when connected', (done) => {
    io.on('connection', (socket) => {
      socket.on('msg:send', (subject, message) => {
        assert.equal(subject, 'testing', 'has correct subject')
        assert.equal(message, 'a testing message to test from', 'has correct message')
        done()
      })
    })

    const con = new Atc('flightcheck')
    con.send('houston', 'testing', 'a testing message to test from')
    .then(() => con.connect(config.server.url))
    .catch(done)
  })
})
