/**
 * houston/src/lib/server/middleware.ts
 * A basic interface for a server controller.
 */

import { injectable } from 'inversify'
import { Context } from 'koa'
import * as Router from 'koa-router'

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
   * Creates a new controller
   */
  public constructor () {
    this.router = new Router({
      prefix: this.prefix
    })
  }

  /**
   * Sets up all of the given routes with the router.
   *
   * @return {void}
   */
  public setupRoutes () {
     return
  }

  /**
   * Returns a list of middleware / routes to run.
   *
   * @async
   * @return {IMiddleware}
   */
  public middleware (): (ctx: Context, next: () => void) => Promise<void> {
    return async (ctx, next) => next()
  }
}
