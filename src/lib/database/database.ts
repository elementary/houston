/**
 * houston/src/lib/database/database.ts
 * The main database class
 *
 * @exports {Class} Database - The master database connection class
 */

import * as Knex from 'knex'
import * as path from 'path'

import { Config } from '../config/class'

/**
 * Database
 * The master database connection class
 *
 * @property {Knex} knex - A knex instance for queries
 */
export class Database {

  public knex: Knex

  protected config: Config

  /**
   * Creates a Database class
   *
   * @param {Config} config - Configuration for database connection
   */
  constructor (config: Config) {
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
  }

}
