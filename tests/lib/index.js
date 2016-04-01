/**
 * tests/lib/index.js
 * Entry for handling all Houston library tests
 */

describe('lib', () => {
  require('./helpers')

  // TODO: Fix atc unit test connection problem
  // require('./atc')
  require('./config')
  require('./database')
  require('./render')
})
