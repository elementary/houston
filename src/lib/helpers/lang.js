/**
 * lib/helpers/lang.js
 * English language helpers
 *
 * @exports {Function} s - Pluralizes string based on number or length
 */

import _ from 'lodash'
import pluralize from 'pluralize'

// Add some rules for more extensive use
pluralize.addUncountableRule('the')
pluralize.addUncountableRule('in')

/**
  * S
  * Pluralizes string based on number or length
  *
  * @param {String} string - String to be translated
  * @param {Blob} len - What to base pluralization on
  * @returns {String} - Transformed string
  */
export function s (string, len = 0) {
  if (_.isArray(len)) {
    len = len.length
  }
  if (_.isPlainObject(len)) {
    len = Object.keys(len)
  }

  const after = string.split(' ')
    .map((word) => {
      return pluralize(word, len)
    })
  after.unshift(len)

  return after.join(' ')
}

/**
 * chop
 * returns a small amount of text from the end of a larger pile of text
 *
 * @param {String} txt - The larger pile of text
 * @param {Number} lines - Number of lines to return
 * @returns {String} - The small pile of text
 */
export function chop (txt, lines = 50) {
  const arr = txt.split('\n')
  const small = arr.slice(-lines)
  return small.join('\n')
}
