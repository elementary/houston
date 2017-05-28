/**
 * houston/src/lib/server/controller/controller.ts
 * A usefull controller class for the server
 *
 * @export {Class} Controller - The master server controller
 */

import { Config } from '../../config/class'
import { Database } from '../../database/database'
import { Log } from '../../log'
import { Server } from '../server'

/**
 * Controller
 * The master server controller
 *
 * @property {Config} config - Configuration to use in the routes
 * @property {Log} log - The log instance to use for global issues
 */
export class Controller {

  protected server: Server
  protected config: Config
  protected database: Database
  protected log: Log

  /**
   * Makes a new Controller. Usually called by the server when registering
   * routes
   *
   * @param {Server} server - The server the controller is being attached to
   * @param {Config} [config] - The configuration to be used for the route
   * @param {Log} [log] - A log instance to be used for things
   */
  constructor (server: Server, config?: Config, database?: Database, log?: Log) {
    this.server = server
    this.config = config || server.config
    this.database = database || server.database
    this.log = log || server.log
  }
}
