/**
 * houston/controller/api/error.js
 * JSONAPI error helper class
 *
 * @see http://jsonapi.org/format/#errors
 *
 * @exports {APIError} default - A error helper class to be used in /api/ routes
 */

import config from 'lib/config'

/**
 * APIError
 * A error helper class to be used in /api/ routes
 */
class APIError extends Error {

  /**
   * constructor
   * Creates a new APIError
   *
   * @param {Number} status - HTTP status code for the error
   * @param {String} title - Error message
   * @param {String} [detail] - Human readable information about the error
   *
   * @returns {APIError} - a new APIError
   */
  constructor (status, title, detail = null) {
    super(title)
    Error.captureStackTrace(this, this.constructor)

    this.name = 'APIError'

    this.id = null
    this.status = status
    this.code = null
    this.title = title
    this.detail = detail
    this.source = null

    this.meta = {
      time: new Date(),
      version: config.houston.version,
      environment: config.env
    }

    if (config.houston.commit !== '.gitless') this.meta['commit'] = config.houston.commit
  }

  /**
   * FromPointer
   * Creates a new APIError with a source pointer
   *
   * @param {Number} status - HTTP status code for the error
   * @param {String} title - Error message
   * @param {String} pointer - JSON Pointer that triggered the error (RFC6901)
   * @param {String} [detail] - Human readable information about the error
   *
   * @returns {APIError} - an APIError with a source pointer
   */
  static FromPointer (status, title, pointer, detail) {
    const e = new APIError(status, title, detail)

    if (e.source == null) e.source = {}
    e.source['pointer'] = pointer

    return e
  }

  /**
   * FromParameter
   * Creates a new APIError with a source parameter
   *
   * @param {Number} status - HTTP status code for the error
   * @param {String} title - Error message
   * @param {String} parameter - The bad parameter that triggered the error
   * @param {String} [detail] - Human readable information about the error
   *
   * @returns {APIError} - an APIError with a source parameter
   */
  static FromParameter (status, title, parameter, detail) {
    const e = new APIError(status, title, detail)

    if (e.source == null) e.source = {}
    e.source['parameter'] = parameter

    return e
  }

  /**
   * toString
   * Returns a string used in console logs
   *
   * @returns {String} - an easy to ready APIError
   */
  toString () {
    return `APIError: ${this.status} - ${this.title}`
  }

  /**
   * toAPI
   * Returns a JSON string representing the error as defined by JSON API
   *
   * @returns {Object} - the error as defined by JSON API
   */
  toAPI () {
    const output = {
      status: this.status,
      title: this.title,
      meta: this.meta
    }

    if (this.id != null) output['id'] = this.id
    if (this.code != null) output['code'] = this.code
    if (this.detail != null) output['detail'] = this.detail
    if (this.source != null) output['source'] = this.source

    return output
  }
}

export default APIError
