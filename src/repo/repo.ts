/**
 * houston/src/repo/repo.ts
 * Entry point for repository syslog server. I whould highly recommend reading
 * some of the code from the node syslogd package and the dgram docs.
 *
 * @exports {Class} repo - A repository syslog server
 */

import * as dgram from 'dgram'

import { Config } from '../lib/config/class'
import { Database } from '../lib/database/database'
import { Log } from '../lib/log'

/**
 * Repo
 * A repository syslog server. Tries to mirror the Server class methods.
 *
 * @property {Config} config
 * @property {Database} database
 * @property {Log} log
 *
 * @property {Socket} server
 * @property {number} port
 */
export class Repo {

  public config: Config
  public database: Database
  public log: Log

  public server: dgram.Socket
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
  }

  /**
   * listen
   * Starts the repository syslogd server
   *
   * @async
   * @param {number} [port] - A port to listen on. Kept for backwards support
   *
   * @throws {Error} - When unable to listen to requested port
   * @return {Server} - An active Server class
   */
  public async listen (port = 0): Promise<this> {
    const env = this.config.get('environment')
    this.server = dgram.createSocket('udp4')

    try {
      await new Promise((resolve, reject) => {
        this.server.bind({ port }, (err: Error) => {
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
   * Stops the syslog server
   *
   * @async
   *
   * @throws {Error} - When the Server class is messed up
   * @return {Server} - An inactive Server class
   */
  public async close (): Promise<this> {
    if (this.server != null) {
      await new Promise((resolve) => {
        this.server.close(() => {
          return resolve()
        })
      })

      this.port = 0
    }

    return this
  }
}
