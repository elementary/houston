/**
 * houston/src/lib/server/error/interface.ts
 * An interface for any error able to be rendered
 */

import { Context } from 'koa'

import { BasicHttpError } from './error'
import { HttpError } from './interface'

/**
 * Makes any sort of error an HTTP handleable error.
 *
 * @param {Error} error
 * @return {HttpError}
 */
export function transform (e: Error): HttpError {
  // TODO: I have yet to find a nice way to convert things. More ninja skill needed
  // tslint:disable-next-line no-any
  const error = e as any as HttpError

  try {
    if (typeof error.httpStatus !== 'number') {
      error.httpStatus = 500
    }

    // That's very weird. Probably a third party error.
    if (error.httpStatus < 200 || error.httpStatus >= 600) {
      error.httpStatus = 500
    }

    if (typeof error.httpRender !== 'function') {
      // We can just set the status and let koa or the browser deal with what to show.
      error.httpRender = async (ctx: Context) => {
        ctx.status = error.httpStatus

        return
      }
    }
  } catch (e) {
    // If there was some weird error trying to convert, cover it up and hope we don't expose secrets.
    return new BasicHttpError()
  }

  return error
}
