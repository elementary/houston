/**
 * houston/src/api/error/error.ts
 * A basic http error made to output to a JSON API
 */

import { Context } from 'koa'

import { BasicHttpError } from '../../lib/server/error/error'
import { upsert } from '../../lib/utility'
import { ApiError } from './interface'

export class BasicApiError extends BasicHttpError implements ApiError {

  /**
   * Renders error to a basic JSON API format
   *
   * @async
   * @param {Context} ctx
   * @return {void}
   */
  public async apiRender (ctx: Context) {
    ctx.status = this.httpStatus

    upsert(ctx.response, 'body.errors', [{
      status: this.httpStatus,
      title: this.httpMessage
    }])
  }
}
