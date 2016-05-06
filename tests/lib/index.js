/**
 * tests/lib/index.js
 * Entry for handling all Houston library tests
 */

describe('lib', () => {
  require('./helpers')

  require('./atc')
  require('./config')
  require('./database')
  require('./mistake')
  require('./render')
})
