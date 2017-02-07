/**
 * lib/error/controller.js
 * Holds all controller errors
 * @flow
 */

import { ApplicationError } from './application'

/**
 * ControllerError
 * A general error thrown in conrollers
 *
 * @extends {ApplicationError}
 * @property {String} friendly - Error message
 * @property {Number} status - HTTP status code
 */
export class ControllerError extends ApplicationError {

  friendly: string
  status: number

  /**
   * Creates a new ControllerError
   *
   * @param {Number} status - HTTP status code of error
   * @param {String} friendly - Error message
   */
  constructor (status: number, friendly: string) {
    super(`${status.toString()}: ${friendly}`)

    this.friendly = friendly
    this.status = status
  }
}

/**
 * ControllerParameterError
 * An error due to parameters
 *
 * @extends {ControllerError}
 * @property {String} param - Parameter message is about
 */
export class ControllerParameterError extends ControllerError {

  param: string

  /**
   * Creates a new ControllerParameterError
   *
   * @param {Number} status - HTTP status code of error
   * @param {String} param - Parameter message is about
   * @param {String} friendly - Error message
   */
  constructor (status: number, param: string, friendly: string) {
    super(status, `${param} - ${friendly}`)

    this.friendly = friendly
    this.param = param
  }
}

/**
 * ControllerPointerError
 * An error due to parameters
 *
 * @extends {ControllerError}
 * @property {String} pointer - Request body JSON pointer
 */
export class ControllerPointerError extends ControllerError {

  pointer: string

  /**
   * Creates a new ControllerPointerError
   *
   * @param {Number} status - HTTP status code of error
   * @param {String} pointer - Request body JSON pointer
   * @param {String} friendly - Error message
   */
  constructor (status: number, pointer: string, friendly: string) {
    super(status, `${pointer} - ${friendly}`)

    this.friendly = friendly
    this.pointer = pointer
  }
}
