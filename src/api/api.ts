/**
 * houston/src/api/api.ts
 * An API http server for houston things
 *
 * @export {Server} Api - An API server
 */

import { Server } from '../lib/server/server'

export class Api extends Server {

  /**
   * registerMiddleware
   * Registers all the koa middleware the server is going to use.
   *
   * @return {void}
   */
  public registerMiddleware (): void {
    this.koa.use((ctx) => this.log.debug(`api endpoint ${ctx.url}`))

    super.registerMiddleware()
  }
}
