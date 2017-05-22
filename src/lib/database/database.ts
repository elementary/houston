/**
 * houston/src/lib/database/database.ts
 * The main database class
 *
 * @exports {Class} Database - The master database connection class
 */

import * as Knex from 'knex'
import * as path from 'path'

import { Config } from '../config/class'
import { Log } from '../log'

/**
 * Database
 * The master database connection class
 *
 * @property {Knex} knex - A knex instance for queries
 */
export class Database {

  public knex: Knex
  public log: Log

  protected config: Config

  /**
   * Creates a Database class
   *
   * @param {Config} config - Configuration for database connection
   * @param {Log} [log] - The log instance to use for reporting
   */
  constructor (config: Config, log?: Log) {
    const migrationPath = path.resolve(__dirname, 'migration')
    const seedPath = path.resolve(__dirname, 'seed')

    // We assign some default file paths for migrations and seeds
    const databaseConfig = Object.assign({}, config.get('database'), {
      migrations: {
        directory: migrationPath,
        tableName: 'migrations'
      },
      seeds: {
        directory: seedPath
      },
      useNullAsDefault: false
    })

    this.config = config

    this.knex = new Knex(databaseConfig)
    this.log = log || new Log(config)
  }

}
