/**
 * service/index.js
 * Handles third party service integrations
 *
 * @exports {Class} ServiceError - error relating to third party services
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
