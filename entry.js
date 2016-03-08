/**
 * entry.js
 * Simple wrapper for babel
 */

require('babel-register')
require('babel-polyfill')

var Path = require('path')

var currentIndex = process.argv.indexOf(__filename)

if (currentIndex === -1) {
  console.log("You probably forgot to run entry with the file ending 'entry.js'")
  throw new Error('could not find entry.js')
}

var script = process.argv[currentIndex + 1]

if (script == null) {
  console.log('Coming into entry wihout a ship')
  throw new Error('entry.js requires a script file to run')
}

if (script[0] !== '/') {
  script = Path.join(__dirname, '/', script)
}

require(script)
