/**
 * entry.js
 * Simple wrapper for babel
 */

import path from 'path'

require('babel-polyfill')

// The code forced me to overwrite native functions. I'm sorry
global.Promise = require('bluebird')

// Find the script we want run
var currentIndex = -1
for (var i = 0; i < process.argv.length; i++) {
  var stringI = process.argv[i].indexOf(path.basename(__filename))
  if (stringI >= 0) {
    currentIndex = i
  }
}

if (currentIndex < 0) {
  // eslint-disable-next-line no-console
  console.error("You probably forgot to run entry with the file ending 'entry.js'")
  throw new Error('could not find entry.js')
}

var script = process.argv[currentIndex + 1]

if (script === 'flightcheck') {
  require('./flightcheck')
} else if (script === 'houston') {
  require('./houston')
} else if (script === 'strongback') {
  require('./strongback')
} else {
  require('../test')
}
