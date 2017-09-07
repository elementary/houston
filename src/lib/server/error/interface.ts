/**
 * houston/src/lib/server/error/interface.ts
 * An interface for any error able to be rendered
 */

import { Context } from 'koa'

export interface HttpError {

  /**
   * Returns the http status code
   *
   * @var {Number}
   */
  httpStatus: number

  /**
   * Renders error to an http output
   *
   * @async
   * @param {Context} ctx
   * @return {void}
   */
  httpRender (ctx: Context): Promise<void>
}
