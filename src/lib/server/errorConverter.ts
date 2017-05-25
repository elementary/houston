/**
 * houston/src/lib/server/errorConverter.ts
 * Converts error to something for the web server
 *
 * @exports {Function} convertError - Converts any error to an Server error
 */

import { ServerError } from './error'

/**
 * convertError
 * Converts any error to a ServerError to be spit out to the client.
 * TODO: I imagine this will get quite expansive the deeper we get
 *
 * @param {Error} err - Any type of error
 * @return {ServerError}
 */
export function convertError (err: Error): ServerError {
  if (err instanceof ServerError) {
    return err
  }

  return new ServerError('An Internal Error Occured', 500)
}
