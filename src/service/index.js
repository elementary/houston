/**
 * service/index.js
 * Handles third party service integrations
 *
 * @exports {Class} ServiceError - error relating to third party services
 * @exports {Function} nameify - turns a string into a RDNN compatible segment
 */

/**
 * ServiceError
 * a specific error relating to communication of third party services
 *
 * @extends Error
 */
export class ServiceError extends Error {

  /**
   * Creates a new serviceError
   *
   * @param {String} msg - message to put on the error
   */
  constructor (msg) {
    super(msg)

    this.code = 'SRCERR'
  }
}

/**
 * nameify
 * Turns a string into a RDNN compatible segment. Replaces whitespace and
 * special characters with dashes
 *
 * @param {String} str - string to transform
 * @returns {String} - a RDNN compatible segment
 */
export function nameify (str) {
  return str
  .toLowerCase()
  .replace(/(\s|_|\.)+/gmi, '-')
  .replace(/(?![a-z0-9]|\-)./gmi, '')
  .replace(/\-+/gmi, '-')
  .replace(/\-(?![a-z0-9])$/gmi, '')
}
