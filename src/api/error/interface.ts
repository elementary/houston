/**
 * houston/src/api/error/interface.ts
 * An interface for any error able to be rendered by the api server
 */

import { Context } from 'koa'

export interface ApiError {

  /**
   * Returns the http status code
   *
   * @var {Number}
   */
  httpStatus: number

  /**
   * Renders error to an api output
   *
   * @async
   * @param {Context} ctx
   * @return {void}
   */
  apiRender (ctx: Context): Promise<void>
}
