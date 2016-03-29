/**
 * tests/lib/atc.js
 * Test atc library for socket connection
 */

import Chai from 'chai'
import Http from 'http'

import Config from '~/config'
import Atc from '~/lib/atc'

let server
let client

describe('lib/atc', () => {
  beforeEach(function (done) {
    server = http.createServer()
    server.listen(Config.server.port)
    done()
  })

  afterEach(function (done) {
    server.close()
    done()
  })
})
