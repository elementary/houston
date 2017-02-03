/**
 * houston/error.js
 * Makes errors friendly and user facing.
 * @flow
 *
 * @exports {Type} Friendly - A type for friendly errors
 * @exports {Function} toFriendly - Transforms an Error to a Friendly type
 */

import config from 'lib/config'

import * as service from 'lib/error/service'

/**
 * Friendly
 * A type holding information able to be showen to the user
 *
 * @type {Object}
 */
export type Friendly = {
  status: number,
  message: string,
  detail: ?string
}

/**
 * toFriendly
 * Transforms any type of Error to something able to be showen to the end user
 *
 * @param {Error} error - An Error to be transformed
 * @return {Friendly} - Publicly shown information
 */
export function toFriendly (error: Error): Friendly {
  const output: Friendly = {
    status: 500,
    message: 'An error occured',
    detail: null
  }

  if (error instanceof service.ServiceError) {
    output.status = 500
    output.message = `Error talking to ${error.service}`
  }

  if (error instanceof service.ServiceLimitError) {
    output.status = 503
    output.message = `Too many requests to ${error.service}`
  }

  if (config.env === 'development') {
    output.message = error.message
    output.detail = error.stack
  }

  return output
}
