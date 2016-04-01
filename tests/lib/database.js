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

/*
 * TODO: Mongoose is throwing an Object prototype error
  it('has correct plugins setup', (done) => {
    const mochaSchema = new db.Schema({
      name: String
    })
    const mochaModel = db.model('mocha', mochaSchema)
    const dbPromise = mochaModel.find().exec()

    assert.isFunction(dbPromise.then, 'queries are a promise')
    assert.isFunction(dbPromise.map, 'queries have a map function')
    assert.isFunction(dbPromise.catch, 'queries have catch function')
    done()
  })
  */
})
