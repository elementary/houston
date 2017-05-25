/**
 * houston/src/lib/server/middleware.ts
 * Common middleware to be used with the server
 *
 * @exports {Function} onError - Function for listening to server errors
 */

import { ServerError } from './error'
import { Server } from './server'

/**
 * onError
 * Reports errors to the console
 *
 * @param {Server} server - The server that throws errors
 * @return {Function} - A listener function
 */
export function onError (server: Server) {

  /**
   * Reports errors to the console
   *
   * @param {Error} err - The error that occured
   * @return {void}
   */
  return (err: Error) => {
    // We allow custom values in the error, but don't log the regular stack
    const errorData = Object.assign({}, err)
    delete errorData.message
    delete errorData.stack

    if ((err instanceof ServerError) === false) {
      server.log.error(err.message, errorData)
      return
    }

    const status = (err as ServerError).status

    if (status >= 500) {
      server.log.error(err.message, errorData)
    } else {
      server.log.debug(err.message, errorData)
    }
  }
}
