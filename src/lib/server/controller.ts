/**
 * houston/src/lib/server/controller.ts
 * A basic interface for a server controller.
 */

import { injectable } from 'inversify'
import { Context } from 'koa'
import * as Router from 'koa-router'

import { IMiddleware } from 'koa-router'

@injectable()
export abstract class Controller {

  /**
   * The prefix for the controller.
   *
   * @var {String}
   */
  protected prefix = '/'

  /**
   * The koa-router instance we will use
   *
   * @var {Router}
   */
  protected router: Router

  /**
   * Sets up the basic router with prefixes and needed settings.
   *
   * @return {Controller}
   */
  public setupRouter () {
    this.router = new Router({
      prefix: this.prefix
    })

    return this
  }

  /**
   * Sets up all of the given routes with the router.
   *
   * @return {Controller}
   */
  public setupRoutes () {
     return this
  }

  /**
   * Returns a list of middleware / routes to run.
   *
   * @async
   * @return {IMiddleware}
   */
  public middleware (): (ctx: Context, next: () => Promise<any>) => Promise<void> {
    this
      .setupRouter()
      .setupRoutes()

    return async (ctx, next) => {
      this.router.routes()(ctx, null)
      this.router.allowedMethods()(ctx, null)
    }
  }
}
