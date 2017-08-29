/**
 * houston/src/lib/server/error/interface.ts
 * An interface for any error able to be rendered
 */

import { Context } from 'koa'

export interface Error {

  /**
   * Returns the http status code
   *
   * @return {Number}
   */
  status (): number

  /**
   * Renders error to an http output
   *
   * @async
   * @param {Context} ctx
   * @return {void}
   */
  render (ctx: Context)
}
