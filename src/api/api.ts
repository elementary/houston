/**
 * houston/src/api/api.ts
 * An API http server for houston things
 *
 * @export {Server} Api - An API server
 */

import { inject, injectable, multiInject } from 'inversify'

import { Server } from '../lib/server/server'

import { compress } from '../lib/server/middleware/compress'
import { checkHeaders } from './middleware/checkHeaders'
import { report } from './middleware/report'
import { setResponse } from './middleware/setResponse'

import { NewestProject } from './controller/newest/project'
import { NewestRelease } from './controller/newest/release'

/**
 * The full API server with registered middleware and controllers
 *
 * @extends {Server}
 *
 * @property {Controller[]} controllers
 * @property {Middleware[]} middlewares
 */
@injectable()
export class Api extends Server {
  /**
   * A list of controllers this server has
   *
   * @var {Controller[]}
   */
  protected controllers = [
    NewestProject,
    NewestRelease
  ]

  /**
   * A list of middlewares that will be ran on every route
   *
   * @var {Middleware[]}
   */
  protected middlewares = [
    checkHeaders,
    compress,
    report,
    setResponse
  ]
}
