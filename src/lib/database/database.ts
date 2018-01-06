/**
 * houston/src/lib/database/database.ts
 * The main database class
 *
 * @exports {Class} Database - The master database connection class
 */

import { inject, injectable } from 'inversify'
import * as Knex from 'knex'
import * as path from 'path'

import { Config } from '../config'
import { Log } from '../log'

/**
 * Database
 * The master database connection class
 *
 * @property {Knex} knex - A knex instance for queries
 */
@injectable()
export class Database {

  public knex: Knex

  protected config: Config
  protected log: Log

  /**
   * Creates a Database class
   *
   * @param {Config} config - Configuration for database connection
   * @param {Log} [log] - The log instance to use for reporting
   */
  constructor (@inject(Config) config: Config, @inject(Log) log: Log) {
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
    this.log = log

    this.knex = new Knex(databaseConfig)
  }

}
