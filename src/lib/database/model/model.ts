/**
 * houston/src/lib/database/model/model.ts
 * A basic master model inherited by everything
 */

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

  public createdAt?: Date
  public updatedAt?: Date
  public deletedAt?: Date|null

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
      const cammelCasedKey = camelCase(key)

      cammelCasedValues[cammelCasedKey] = values[key]
    })

    const record = new this(cammelCasedValues)

    record.exists = true

    return record
  }

  /**
   * findById
   * Finds a record in the database
   *
   * @async
   * @return {Model}
   */
  public static async findById (database: Database, id: string) {
    const record = await database.knex
      .table(this.table)
      .where('id', id)
      .where('deleted_at', null)
      .first()

    if (record == null) {
      return null
    }

    return this.castFromDatabase(record)
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
  public set isDeleted(value: boolean) {
    if (value === true) {
      this.deletedAt = new Date()
    } else {
      this.deletedAt = null
    }
  }
}
