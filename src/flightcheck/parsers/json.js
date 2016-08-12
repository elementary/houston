/**
 * flightcheck/parsers/json.js
 * Probably the smallest file you will see in this project
 *
 * @exports {Function} read - reads a JSON string
 * @exports {Function} write - writes a JSON string
 */

/**
 * read
 * Reads a JSON file and parses it to javascript object
 *
 * @param {String} str - a JSON string to parse
 * @returns {Object} - a javascript object of the JSON string
 */
export async function read (str) {
  return JSON.parse(str)
}

/**
 * write
 * Writes a JSON string from javascript object
 *
 * @param {Object} data - a javascript object to put into string
 * @returns {String} - a JSON string
 */
export async function write (data) {
  return JSON.stringify(data, null, '\t')
}
