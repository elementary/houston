/**
 * flightcheck/parsers/ini.js
 * Uses ini package for parsing files
 *
 * @exports {Function} read - reads a ini string
 * @exports {Function} write - writes a ini string
 */

import ini from 'ini'

/**
 * read
 * Reads a ini string and parses it to javascript object
 *
 * @param {String} str - a ini string to parse
 * @returns {Object} - javascript object of ini string
 */
export async function read (str) {
  return ini.parse(str)
}

/**
 * write
 * Writes a ini string from javascript object
 *
 * @param {Object} data - a javascript object to put into string
 * @returns {String} - a ini string representation of the javascript object
 */
export async function write (data) {
  return ini.stringify(data, {
    whitespace: true
  })
}
