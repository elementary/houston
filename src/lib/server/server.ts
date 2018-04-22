/**
 * houston/src/lib/server/server.ts
 * A basic HTTP web server used for various processes.
 *
 * @exports {Class} Server - An HTTP web server
 */

import * as http from 'http'
import { inject, injectable, multiInject } from 'inversify'
import * as Koa from 'koa'
import * as Router from 'koa-router'

import { report } from './middleware/report'

import { Config } from '../config'
import { Logger } from '../log'
import { Controller } from './controller'
import { Servable } from './type'

// To match the Koa middleware signature requires an any type
// tslint:disable-next-line no-any
export type Middleware = (config: Config) => (ctx: Koa.Context, next?: () => Promise<any>) => void

/**
 * Server
 * A basic HTTP web server
 *
 * @property {Server} server
 * @property {number} port
 *
 * @property {boolean} active
 */
@injectable()
export class Server implements Servable {
  /**
   * A basic http server. Used for low level access (mostly testing)
   *
   * @var {http.Server}
   */
  public server?: http.Server

  /**
   * The http port we will bind to
   *
   * @var {Number}
   */
  public port?: number

  /**
   * The application configuration
   *
   * @var {Config}
   */
  protected config: Config

  /**
   * A list of controllers this server has
   *
   * @var {Controller[]}
   */
  protected controllers: Controller[] = []

  /**
   * A list of middlewares that will be ran on every route
   *
   * @var {Middleware[]}
   */
  protected middlewares: Middleware[] = [
    report
  ]

  /**
   * A logger instance for the whole server.
   *
   * @var {Logger}
   */
  protected logger: Logger

  /**
   * Our Koa server instance
   *
   * @var {Koa}
   */
  protected koa: Koa

  /**
   * The koa router via koa-router
   *
   * @var {Router} router
   */
  protected router: Router

  /**
   * Creates a new web server
   *
   * @param {Config} config - The configuration to use
   * @param {Log} log - The logger instance to use
   */
  constructor (
    @inject(Config) config: Config,
    @inject(Logger) logger: Logger
  ) {
    this.config = config
    this.logger = logger

    this.koa = new Koa()
    this.router = new Router()

    this.koa.env = config.get('environment', 'production')
  }

  /**
   * Returns true if the http server is currently active.
   *
   * @return {boolean}
   */
  public get active (): boolean {
    return (this.server !== undefined)
  }

  /**
   * listen
   * Starts web server services
   *
   * @async
   * @param {number} [port] - A port to listen on. Kept for backwards support
   *
   * @throws {Error} - When unable to listen to requested port
   * @return {Server} - An active Server class
   */
  public async listen (port = 0): Promise<this> {
    const env = this.config.get('environment')

    try {
      this.server = this
        .registerControllers()
        .registerMiddleware()
        .http()

      await new Promise((resolve, reject) => {
        this.server.listen(port, undefined, undefined, (err: Error) => {
          if (err) {
            return reject(err)
          }

          return resolve()
        })
      })
    } catch (err) {
      this.logger.error(`Server unable to listen on port ${port} with ${env} configuration`)
        .setError(err)
        .send()

      throw err
    }

    this.port = this.server.address().port
    this.logger.info(`Server listening on port ${this.port} with ${env} configuration`).send()

    return this
  }

  /**
   * close
   * Stops the HTTP server
   *
   * @async
   *
   * @throws {Error} - When the Server class is messed up
   * @return {Server} - An inactive Server class
   */
  public async close (): Promise<this> {
    if (this.server != null) {
      await new Promise((resolve, reject) => {
        this.server.close((err) => {
          if (err != null) {
            return reject(err)
          }

          return resolve()
        })
      })
    }

    this.server = null
    this.port = null

    return this
  }

  /**
   * http
   * Returns an http server wrapping current server. Used for testing and low
   * level plugins
   *
   * @return {http.Server} - HTTP web server
   */
  public http (): http.Server {
    return http.createServer(this.koa.callback())
  }

  /**
   * Adds all of the controllers to the server.
   *
   * @return {Server}
   */
  protected registerControllers () {
    this.controllers.forEach((controller) => {
      this.koa.use(controller.middleware())
    })

    return this
  }

  /**
   * Adds all of the middleware functions to the server.
   *
   * @return {Server}
   */
  protected registerMiddleware () {
    this.middlewares.forEach((middleware) => {
      this.koa.use(middleware(this.config))
    })

    return this
  }
}
