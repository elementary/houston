/**
 * houston/src/repo/repo.ts
 * Entry point for repository syslog server. I whould highly recommend reading
 * some of the code from the node syslogd package and the dgram docs.
 *
 * TODO: We should cache download count for a while so we can mass increment
 *
 * @exports {Class} Repo - A repository syslog server
 */

import * as dgram from 'dgram'
import { inject, injectable } from 'inversify'

import { Config } from '../lib/config'
import { Database } from '../lib/database/database'
import { Logger } from '../lib/log'

/**
 * Repo
 * A repository syslog server. Tries to mirror the Server class methods.
 *
 * @property {Socket} server
 * @property {number} port
 */
@injectable()
export class Repo {

  public server: dgram.Socket
  public port: number

  protected config: Config
  protected database: Database
  protected logger: Logger

  /**
   * Creates a new web server
   *
   * @param {Config} config - The configuration to use
   * @param {Database} database - The database connection to use
   * @param {Logger} logger - The log instance to use
   */
  constructor (
    @inject(Config) config: Config,
    @inject(Database) database: Database,
    @inject(Logger) logger: Logger
  ) {
    this.config = config
    this.database = database
    this.logger = logger
  }

  /**
   * onError
   * Handles a download message from web server
   *
   * @param {Error} err - An error that occured
   *
   * @return {void}
   */
  public onError (err: Error): void {
    this.logger
      .error('Internal server error')
      .setError(err)
      .send()
  }

  /**
   * onMessage
   * Handles a download message from web server
   *
   * @async
   * @param {Buffer} buf - The message sent from the web server
   *
   * @return {void}
   */
  public async onMessage (buf: Buffer): Promise<void> {
    const message = buf.toString('utf8').split(': ')[1]

    // Possibly a broken message?
    if (message == null || message === '') {
      return
    }

    // Format: ip address | status code | path | bytes | user agent | time
    const [, status] = message.split('|')

    // Trying to get a file that errored, or does not exist.
    if (Number(status) >= 400) {
      return
    }

    // TODO: Increment package download count
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

    this.server.on('error', (err) => this.onError(err))
    this.server.on('message', (msg) => this.onMessage(msg))

    try {
      await new Promise((resolve, reject) => {
        this.server.bind({ port }, () => resolve())
      })
    } catch (err) {
      this.logger
        .error(`Server unable to listen on port ${port} with ${env} configuration`)
        .setError(err)
        .send()

      throw err
    }

    const address = this.server.address()

    if (typeof address !== 'string') {
      this.port = address.port
    }

    this.logger
      .info(`Server listening on port ${this.port} with ${env} configuration`)
      .send()

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
        this.server.close(() => resolve())
      })

      this.port = 0
    }

    return this
  }
}
