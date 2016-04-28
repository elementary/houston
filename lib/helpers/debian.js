/**
 * lib/helpers/debian.js
 * Functions to conform things to debian standards
 *
 * @exports {Function} time - transforms javascript date object to debian time
 */

/**
 * time
 * transforms javascript date object to debian time
 *
 * @param {Date} date - javascript date object
 * @returns {String} - converted debian time string
 */
export function time (date) {
  return date.toUTCString().replace('GMT', '+0000')
}
