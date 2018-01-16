/**
 * houston/src/lib/server/type.d.ts
 * Useful server interfaces
 */

import { Context } from 'koa'

export interface Servable {
  active: boolean

  listen (port?: number): Promise<Servable>
  close (): Promise<Servable>
}

export interface Error {
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
