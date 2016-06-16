/**
 * tests/lib/grid.js
 * Test for database file management
 */

import * as grid from '~/lib/grid'
import chai from 'chai'

const assert = chai.assert
const file = new Buffer('test file')

describe('grid', () => {
  it('can create and find a file', (done) => {
    grid.create(file, { meta: 'data' })
    .then((id) => grid.get(id))
    .then((data) => {
      assert.isObject(data, 'returns an object')
      assert.deepEqual(data.buffer, file, 'returns same file buffer')
      assert.equal(data.metadata.meta, 'data', 'returns saved metadata')

      done()
    })
    .catch((error) => done(error))
  })
})
