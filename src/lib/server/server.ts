/**
 * houston/src/lib/server/server.ts
 * A basic HTTP web server used for various processes.
 *
 * @exports {Class} Server - An HTTP web server
 */

import * as http from 'http'
import * as Koa from 'koa'
import * as Router from 'koa-router'

import { Config } from '../config'
import { Database } from '../database/database'
import { Log } from '../log'
import * as middleware from './middleware'

import { ServerError } from './error'

import { Health } from './controller/health'

/**
 * Server
 * A basic HTTP web server
 *
 * @property {Config} config
 * @property {Database} database
 * @property {Log} log
 *
 * @property {Koa} koa
 * @property {Router} router
 *
 * @property {Server} server
 * @property {number} port
 */
export class Server {

  public config: Config
  public database: Database
  public log: Log

  public koa: Koa
  public router: Router

  public server: http.Server
  public port: number

  /**
   * Creates a new web server
   *
   * @param {Config} config - The configuration to use
   * @param {Database} [database] - The database connection to use
   * @param {Log} [log] - The log instance to use
   */
  constructor (config: Config, database?: Database, log?: Log) {
    this.config = config
    this.database = database || new Database(config)
    this.log = log || new Log(config)

    this.koa = new Koa()
    this.router = new Router()

    this.koa.env = config.get('environment', 'production')

    this.registerMiddleware()
    this.registerRoutes()

    this.koa.use(this.router.routes())
    this.koa.use(this.router.allowedMethods())
  }

  /**
   * registerMiddleware
   * Registers all the koa middleware the server is going to use.
   *
   * @return {void}
   */
  public registerMiddleware (): void {
    this.koa.on('error', middleware.onError(this))

    this.router.use(middleware.Compress(this))
    this.router.use(middleware.Logger(this))
  }

  /**
   * registerRoutes
   * Registers all the koa routes the server is going to use.
   *
   * @return {void}
   */
  public registerRoutes (): void {
    const health = new Health(this)

    this.router.get('/health', health.view)

    this.router.all('*', (ctx) => {
      if (ctx.status === 404 && ctx.body == null) {
        throw new ServerError('Endpoint Not Found', 404, ctx.url)
      }
    })
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
    this.server = this.http()

    try {
      await new Promise((resolve, reject) => {
        this.server.listen(port, undefined, undefined, (err: Error) => {
          if (err) {
            return reject(err)
          }

          return resolve()
        })
      })
    } catch (err) {
      this.log.error(`Server unable to listen on port ${port} with ${env} configuration`)
      this.log.error(err)

      throw err
    }

    this.port = this.server.address().port
    this.log.info(`Server listening on port ${this.port} with ${env} configuration`)

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

      this.port = 0
    }

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
}
