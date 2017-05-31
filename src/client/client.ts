/**
 * houston/src/api/api.ts
 * An API http server for houston things
 *
 * @export {Server} Api - An API server
 */

import * as path from 'path'

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
    this.router.use(middleware.assets(this, path.resolve(__dirname, 'public')))

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

    this.router.get('/', homepage.view)
    this.router.get('/homepage', homepage.view)

    super.registerRoutes()
  }
}
