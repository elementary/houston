/**
 * tests/lib/database.js
 * Test for database connection and bluebird promises
 */

import db from '~/lib/database'

describe('database', () => {
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
