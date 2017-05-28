/**
 * houston/src/lib/database/model/model.ts
 * A basic master model inherited by everything
 */

import * as Knex from 'knex'
import { camelCase, isArray } from 'lodash'
import * as uuid from 'uuid/v4'

import { Database } from '../database'

/**
 * Model
 * A basic master model to be inherited by other models
 *
 * @property {string} id - The record's ID
 *
 * @property {Date} createdAt - The date the record was created at
 * @property {Date} updatedAt - The date the record was last updated
 * @property {Date} [deletedAt] - The date the record may have been deleted
 */
export class Model {

  /**
   * table
   * The table name for the current model
   *
   * @var {string}
   */
  protected static table: string

  public id: string

  public createdAt: Date
  public updatedAt: Date
  public deletedAt?: Date|null

  /**
   * exists
   * If this record already exists in the database
   *
   * @var {boolean}
   */
  protected exists = false

  /**
   * guarded
   * All properties that should not be included when put to object or json
   *
   * @var {string[]}
   */
  protected guarded: string[] = []

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
  public static castFromDatabase (values: object) {
    const cammelCasedValues = {}

    Object.keys(values).forEach((key) => {
      cammelCasedValues[camelCase(key)] = values[key]
    })

    const record = new this(cammelCasedValues)

    record.exists = true

    return record
  }

  /**
   * query
   * This is a super master query function so we can put data in a model
   * TODO: can't we just do some fancy magic and overwrite a knex thing?
   *
   * @param {Database} database - The database to query
   * @param {Function} fn - A function given a query and returning a query
   * @return {mixed}
   */
  public static async query (database: Database, fn: (q: Knex) => Knex) {
    const query = fn(database.knex.table(this.table))
    const result = await query

    if (result == null) return null

    if (isArray(result)) {
      return result.map((res) => this.castFromDatabase(res))
    }

    return this.castFromDatabase(result)
  }

  /**
   * findById
   * Finds a record in the database
   *
   * @async
   * @return {Model}
   */
  public static async findById (database: Database, id: string) {
    return this.query(database, (q) => {
      return q
        .where('id', id)
        .where('deleted_at', null)
        .first()
    })
  }

  /**
   * Creates a Model class
   *
   * @param {object} [values] - Initial values to be set
   */
  constructor (values?: object) {
    if (values != null) {
      Object.keys(values).forEach((key) => {
        this[camelCase(key)] = values[key]
      })
    }

    if (this.id == null) {
      this.id = Model.createId()
    }

    if (this.createdAt == null) {
      this.createdAt = new Date()
    }

    if (this.updatedAt == null) {
      this.updatedAt = new Date()
    }
  }

  /**
   * isDeleted
   * Tells if the record has been soft deleted or not
   *
   * @return {boolean}
   */
  public get isDeleted (): boolean {
    if (this.deletedAt == null) {
      return false
    }

    return true
  }

  /**
   * isDeleted
   * Sets the deleted at date
   *
   * @param {boolean} value - True if the record should be deleted
   * @return {void}
   */
  public set isDeleted (value: boolean) {
    if (value === true) {
      this.deletedAt = new Date()
    } else {
      this.deletedAt = null
    }
  }

  /**
   * toObject
   * Transforms the current model to a plain object
   *
   * @return {object}
   */
  public toObject () {
    const res = {}

    Object.keys(this).forEach((key) => {
      if (this.guarded.indexOf(key) === -1) {
        res[key] = this[key]
      }
    })

    return res
  }

  /**
   * toJson
   * Transforms the current model to a json value
   *
   * @return {string}
   */
  public toJson () {
    return JSON.stringify(this.toObject())
  }
}
