/**
 * houston/src/lib/server/server.ts
 * A basic HTTP web server used for various processes.
 *
 * @exports {Class} Server - An HTTP web server
 */

import * as http from 'http'
import * as Koa from 'koa'

import { Config } from '../config/class'
import { Database } from '../database/database'
import { Log } from '../log'

/**
 * Server
 * A basic HTTP web server
 */
export class Server {

  public log: Log
  public port: number|null

  protected config: Config
  protected database: Database

  protected koa: Koa

  /**
   * Creates a new web server
   *
   * @param {Config} config - The configuration to use
   * @param {Database} [database] - The database connection to use
   * @param {Log} [log] - The log instance to use
   */
  constructor (config: Config, database?: Database, log?: Log) {
    this.log = log || new Log(config)
    this.port = null

    this.config = config
    this.database = database || new Database(config)

    this.koa = new Koa()
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
  public async listen (port = 0): Promise<Server> {
    const env = this.config.get('environment')
    const server = this.http()

    try {
      await new Promise((resolve, reject) => {
        server.listen(port, undefined, undefined, (err: Error) => {
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

    this.port = server.address().port
    this.log.info(`Server listening on port ${this.port} with ${env} configuration`)

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
