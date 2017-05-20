/**
 * houston/src/lib/database/model/model.ts
 * A basic master model inherited by everything
 */

import * as Knex from 'knex'
import { camelCase } from 'lodash'
import * as uuid from 'uuid/v4'

import { Database } from '../database'

/**
 * Model
 * A basic master model to be inherited by other models
 *
 * @property {string} id - The record's ID
 */
export class Model {

  protected static table: string

  protected exists = false

  public id?: string

  /**
   * createId
   * Creates a new UUID for use in the model.
   *
   * @return {string}
   */
  public static createId (): string {
    return uuid()
  }

  /**
   * castFromDatabase
   * Takes values from the database to create a model
   *
   * @param {object} values - Values from the database
   * @return {Model}
   */
  public static castFromDatabase (values: object): Model {
    const cammelCasedValues = {}

    Object.keys(values).forEach((key) => {
      const cammelCasedKey = camelCase(key)

      cammelCasedValues[cammelCasedKey] = values[key]
    })

    return new this(cammelCasedValues)
  }

  /**
   * findById
   * Finds a record in the database
   *
   * @async
   * @return {Model}
   */
  public static async findById (database: Database, id: string): Promise<Model|null> {
    const record = await database.knex
      .table(this.table)
      .where('id', id)
      .first()

    if (record == null) {
      return null
    }

    return this.castFromDatabase(record)
  }

  /**
   * findById
   * Finds records in the database
   *
   * @async
   * @return {Model}
   */
  public static async find (database: Database, fn: (knex: Knex) => Knex): Promise<[Model]> {
    const knex = database.knex.table(this.table)
    const query = fn(knex)
    const records = await query.get()

    return records.map((record) => this.castFromDatabase(record))
  }

  /**
   * Creates a Model class
   *
   * @param {object} [values] - Initial values to be set
   */
  constructor (values?: object) {
    if (values != null) {
      Object.keys(values).forEach((key) => {
        this[key] = values[key]
      })
    }
  }
}
