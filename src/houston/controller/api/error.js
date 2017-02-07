/**
 * houston/controller/api/error.js
 * Makes errors friendly and api facing.
 * @flow
 *
 * @exports {Type} API - A type for JSON API errors
 * @exports {Function} toAPI - Transforms an Error to a API type
 */

import { toFriendly } from 'houston/error'
import * as controller from 'lib/error/controller'

/**
 * APISource
 * A type holding information according to JSON API error source spec
 */
export type APISource = {
  parameter: ?string,
  pointer: ?string
}

/**
 * API
 * A type holding information according to JSON API error spec
 *
 * @type {Object}
 */
export type API = {
  status: number,
  title: string,
  detail: ?string,
  source: ?APISource
}

/**
 * toAPI
 * Transforms any type of Error to something able to be showen to the end user
 *
 * @param {Error} error - An Error to be transformed
 * @return {Friendly} - Publicly shown information
 */
export function toAPI (error: Error): API {
  const friendly = toFriendly(error)

  const output: API = {
    status: friendly.status,
    title: friendly.message,
    detail: friendly.detail,
    source: null
  }

  if (error instanceof controller.ControllerParameterError) {
    output.source = {
      parameter: error.param,
      pointer: null
    }
  } else if (error instanceof controller.ControllerPointerError) {
    output.source = {
      parameter: null,
      pointer: error.pointer
    }
  }

  return output
}
