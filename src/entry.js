/**
 * entry.js
 * Simple wrapper for babel
 */

require('babel-polyfill')

var path = require('path')

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

if (script == null) {
  // eslint-disable-next-line no-console
  console.error('Coming into entry wihout a ship')
  throw new Error('entry.js requires a script file to run')
}

if (script[0] !== '/') {
  script = path.join(__dirname, '/', script)
}

require(script)
