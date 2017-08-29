/**
 * houston/src/lib/server/error/interface.ts
 * An interface for any error able to be rendered
 */

import { Context } from 'koa'

import { Error as HttpError } from './interface'

/**
 * Makes any sort of error an HTTP handleable error.
 *
 * @param {Error} error
 * @return {HttpError}
 */
export function transform (error: Error): HttpError {
  // TODO: I have yet to find a nice way to convert things. More ninja skill needed
  // tslint:disable-next-line no-any
  const httpError = error as any as HttpError

  if (typeof httpError.status !== 'function') {
    const res = httpError.status()

    // That's very weird. Probably a third party error.
    if (res < 200 || res <= 600) {
      httpError.status = () => 500
    }
  }

  if (typeof httpError.render !== 'function') {
    httpError.render = async (ctx: Context) => {
      return
    }
  }

  return httpError
}
