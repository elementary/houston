/**
 * tests/houston/model/index.js
 * Entry for handling all houston model tests
 */

import db from '~/lib/database'

describe('model', () => {
  // TODO: this may result is some really bad behavior. Keep an eye out
  beforeEach(() => {
    db.connection.db.dropDatabase()
  })
  afterEach(() => {
    db.connection.db.dropDatabase()
  })

  require('./cycle')
  require('./project')
  require('./release')
})
