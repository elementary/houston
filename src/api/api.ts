/**
 * houston/src/api/api.ts
 * An API http server for houston things
 *
 * @export {Server} Api - An API server
 */

import { Context } from '../lib/server/middleware'
import { Server } from '../lib/server/server'
import * as middleware from './middleware'

import { NewestProject } from './controller/newest/project'

export class Api extends Server {

  /**
   * registerMiddleware
   * Registers all the koa middleware the server is going to use.
   *
   * @return {void}
   */
  public registerMiddleware (): void {
    this.router.use(middleware.catchError(this))
    this.router.use(middleware.checkHeaders(this))
    this.router.use(middleware.setResponse(this))
    this.router.use(middleware.wrapBody(this))

    super.registerMiddleware()
  }

  /**
   * registerRoutes
   * Registers all the koa routes the server is going to use.
   *
   * @return {void}
   */
  public registerRoutes (): void {
    const newestProject = new NewestProject(this)

    this.router.get('/newest/project', (ctx: Context) => newestProject.view(ctx))

    super.registerRoutes()
  }
}
