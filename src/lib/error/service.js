/**
 * lib/error/service.js
 * Holds all errors that could occur from third party services
 * @flow
 */

import { ApplicationError } from './application'

/**
 * ServiceError
 * An error relating to communication of third party services
 *
 * @property {String} service - Name of service error is from
 */
export class ServiceError extends ApplicationError {

  service: string

  /**
   * Creates a new ServiceError
   *
   * @param {String} service - Name of third party service error is from
   * @param {String} message - Error message
   */
  constructor (service: string, message: string) {
    super(`${service}: ${message}`)

    this.service = service
  }
}

/**
 * ServiceRequestError
 * A general HTTP error from third party service
 *
 * @property {Number} status - HTTP status code of request
 */
export class ServiceRequestError extends ServiceError {

  status: Number

  /**
   * Creates a new ServiceRequestError
   *
   * @param {String} service - Name of third party service error is from
   * @param {Number} status - HTTP status code of request
   * @param {String} message - Error message
   */
  constructor (service: string, status: Number, message: string) {
    super(service, `${status.toString()} - ${message}`)

    this.status = status
  }
}

/**
 * ServiceLimitError
 * An error relating to rate limiting on third party services
 *
 * @property {Date} expire - Date when more requests will be available
 */
export class ServiceLimitError extends ServiceError {

  expire: Date

  /**
   * Creates a new ServiceLimitError
   *
   * @param {String} service - Name of third party service error is from
   * @param {Date} [expire] - Date when more requests will be available
   */
  constructor (service: string, expire: ?Date) {
    if (expire != null) {
      super(service, `Rate limit reached until ${expire.toString()}`)
    } else {
      super(service, 'Rate limit reached')
    }

    if (expire != null) this.expire = expire
  }
}
