/**
 * houston/src/lib/server/error/error.ts
 * A super basic easy to use http server error
 */

import { Context } from 'koa'

import { Error as HttpError } from '../type'

export class BasicHttpError extends Error implements HttpError {

  /**
   * The HTTP status code
   *
   * @var {Number}
   */
  public httpStatus: number

  /**
   * A public readable error message
   *
   * @var {String}
   */
  public httpMessage: string

  /**
   * Creates a new basic http error
   *
   * @param {Number} status
   * @param {String} message
   */
  public constructor (status = 500, message = 'Internal Server Error') {
    super(message)

    this.httpStatus = status
    this.httpMessage = message
  }

  /**
   * Renders error to an http output
   *
   * @async
   * @param {Context} ctx
   * @return {void}
   */
  public async httpRender (ctx: Context) {
    ctx.status = this.httpStatus
    ctx.body = `${this.httpStatus} - ${this.httpMessage}`

    return
  }
}
