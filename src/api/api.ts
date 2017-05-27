/**
 * houston/src/api/api.ts
 * An API http server for houston things
 *
 * @export {Server} Api - An API server
 */

import { Server } from '../lib/server/server'
import * as middleware from './middleware'

export class Api extends Server {

  /**
   * registerMiddleware
   * Registers all the koa middleware the server is going to use.
   *
   * @return {void}
   */
  public registerMiddleware (): void {
    this.koa.use(middleware.catchError(this))
    this.koa.use(middleware.checkHeaders(this))
    this.koa.use(middleware.wrapBody(this))

    super.registerMiddleware()
  }
}
