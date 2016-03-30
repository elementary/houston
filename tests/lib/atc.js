/**
 * tests/lib/atc.js
 * Test atc library for socket connection
 */

import Chai from 'chai'
import Koa from 'koa'
import Http from 'http'
import _ from 'lodash'

import { Config } from '~/app'

const expect = Chai.expect

let koaServer
let httpServer
let server
let client

describe('lib/atc', () => {
  beforeEach(function (done) {
    koaServer = new Koa()
    httpServer = Http.createServer(koaServer.callback())

    server = _.cloneDeep(require('../../lib/atc'))
    server.init('server', httpServer)

    delete require.cache[require.resolve('../../lib/atc')]

    client = _.cloneDeep(require('../../lib/atc'))

    httpServer.listen(Config.server.port + 1, () => {
      client.init('client', Config.server.port + 1)
      done()
    })
  })

  afterEach(function (done) {
    httpServer.close()
    koaServer = null
    httpServer = null
    server = null
    client = null
    done()
  })

  it('sends messages', function (done) {
    client.on('msg:test', (msg) => {
      expect(msg).is('works')
      done()
    })

    server.send('msg:test', 'works')
  })
})
