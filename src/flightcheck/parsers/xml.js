/**
 * flightcheck/parsers/xml.js
 * Parses and writes simple xml files.
 *
 * @exports {Function} read - reads a XML string
 * @exports {Function} write - writes a XML string
 */

import xml from 'xml2js'

/**
 * read
 * Reads a XML file and parses it to javascript object
 *
 * @param {String} str - a XML string to parse
 * @returns {Object} - a javascript object of the XML string
 */
export function read (str) {
  return new Promise((resolve, reject) => {
    xml.parseString(str, (err, res) => {
      if (err != null) return reject(err)

      return resolve(res)
    })
  })
}

/**
 * write
 * Writes a XML string from javascript object
 *
 * @param {Object} data - a javascript object to put into string
 * @returns {String} - a XML string
 */
export async function write (data) {
  const builder = new xml.Builder()
  return builder.buildObject(data)
}
