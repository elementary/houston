/**
 * tests/lib/database.js
 * Test for database connection and bluebird promises
 */

import chai from 'chai'

import db from '~/lib/database'

const assert = chai.assert

describe('database', () => {
  it('has a correct database install', (done) => {
    assert.isAbove(db.connection.readyState, 0, 'can connect to database')

    done()
  })

  it('has correct promise functions', (done) => {
    const mochaSchema = new db.Schema({
      name: String,
      age: Number
    })
    const mochaModel = db.model('mocha', mochaSchema)

    return mochaModel.find()
    .then((data) => data)
    .map((data) => data)
    .then(done())
    .catch((error) => done(error))
  })
})
