/**
 * houston/src/api/error/transform.ts
 * An interface for any error able to be rendered
 */

import { Context } from 'koa'

import { HttpError } from '../../lib/server/error/interface'
import { upsert } from '../../lib/utility'
import { BasicApiError } from './error'
import { ApiError } from './interface'

/**
 * Makes any sort of error an API handleable error.
 *
 * @param {Error} error
 * @return {ApiError}
 */
export function transform (e: Error): ApiError {
  // TODO: I have yet to find a nice way to convert things. More ninja skill needed
  // tslint:disable-next-line no-any
  const error = e as any

  try {
    if (typeof error.httpStatus !== 'number') {
      error.httpStatus = 500
    }

    // That's very weird. Probably a third party error.
    if (error.httpStatus < 200 || error.httpStatus >= 600) {
      error.httpStatus = 500
    }

    if (typeof error.apiRender !== 'function') {
      // We can just set the status and let koa or the browser deal with what to show.
      error.apiRender = async (ctx: Context) => {
        ctx.status = error.httpStatus

        upsert(ctx.response, 'body.errors', [{
          status: error.httpStatus,
          title: error.httpMessage || 'Error'
        }])
      }
    }
  } catch (e) {
    // If there was some weird error trying to convert, cover it up and hope we don't expose secrets.
    return new BasicApiError()
  }

  return error
}
