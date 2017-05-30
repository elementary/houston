/**
 * houston/src/api/api.ts
 * An API http server for houston things
 *
 * @export {Server} Api - An API server
 */

import { Server } from '../lib/server/server'
import * as middleware from './middleware'

import { Homepage } from './controller/homepage'

export class Client extends Server {

  /**
   * registerMiddleware
   * Registers all the koa middleware the server is going to use.
   *
   * @return {void}
   */
  public registerMiddleware (): void {
    this.router.use(middleware.render(this))
    this.router.use(middleware.catchError(this))

    super.registerMiddleware()
  }

  /**
   * registerRoutes
   * Registers all the koa routes the server is going to use.
   *
   * @return {void}
   */
  public registerRoutes (): void {
    const homepage = new Homepage(this)

    this.router.get('/', (ctx: middleware.Context) => homepage.view(ctx))

    super.registerRoutes()
  }
}
