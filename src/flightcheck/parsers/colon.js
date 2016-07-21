/**
 * flightcheck/parsers/colon.js
 * Parses colon seperated lists like the Debian control file
 *
 * @exports {Function} read - reads a colon string
 * @exports {Function} write - writes a colon string
 */

import _ from 'lodash'

/**
 * read
 * Reads a colon seperated string and parses it to javascript object
 *
 * @param {String} str - a colon seperated string to parse
 * @returns {Object} - a javascript representation of the string
 */
export async function read (str) {
  // Test if it's an empty file (no real charactors)
  if (!/\S/.test(str)) {
    return {}
  }

  const lines = str.split('\n')

  const data = {}
  let current = null
  let type = 'simple' // @see https://www.debian.org/doc/debian-policy/ch-controlfields.html 5.1 Syntax of control files

  lines.forEach((line) => {
    const [first, ...extra] = _.trim(line).split(':')
    const key = _.trim(first)

    if (!/\S/.test(key)) return // empty line

    if (extra.length > 0) { // only what appears to be simple types here
      current = key

      const value = _.trim(extra.join(':'))
      const last = value.slice(-1)

      if (last !== ',') {
        type = 'simple'
        data[key] = value
        return
      }

      // a folded type list (multiple values each on a unique line)
      type = 'folded'
      data[key] = [value.slice(0, -1)]
      return
    }

    // only folded and multiline types get here
    if (type === 'folded') {
      let value = key
      if (key.slice(-1) === ',') {
        value = key.slice(0, -1)
      }

      data[current].push(value)
      return
    }

    if (type === 'simple' || type === 'multiline') { // we can't tell a multiline vs simple from the first line
      type = 'multiline'

      data[current] += `\n${line}` // keep any whitespace around it
      return
    }
  })

  return data
}

/**
 * write
 * Writes a colon seperated string from javascript object
 *
 * @param {Object} data - a javascript object to put into string
 * @returns {String} - a simple string of colon seperated values
 */
export async function write (data) {
  let str = ''

  Object.keys(data).forEach((key) => {
    const value = data[key]

    if (typeof value === 'string') {
      str += `${key}: ${value}\n`
      return
    }

    const padding = key.length + 2
    str += `${key}: ${value[0]},\n`
    for (let i = 1; i < value.length; i++) {
      str += `${' '.repeat(padding)}${value[i]}${(i + 1 !== value.length) ? ',' : '\n'}\n`
    }
  })

  return str
}
