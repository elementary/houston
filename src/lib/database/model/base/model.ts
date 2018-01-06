/**
 * houston/src/lib/database/model/base/model.ts
 * A basic master model inherited by everything
 */

import * as Knex from 'knex'
import { camelCase, isArray } from 'lodash'
import * as uuid from 'uuid/v4'

import { Database } from '../../database'
import { Query } from './query'

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
  public static table: string

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

    // Date converting all of the `xxxxAt` columns
    Object.keys(cammelCasedValues)
      .filter((key) => key.endsWith('At'))
      .filter((key) => (cammelCasedValues[key] != null))
      .forEach((key) => {
        cammelCasedValues[key] = new Date(cammelCasedValues[key])
      })

    const record = new this(cammelCasedValues)

    record.exists = true

    return record
  }

  /**
   * query
   * This is a super master query function so we can put data in a model
   *
   * @param {Database} database - The database to query
   * @return {Query}
   */
  public static query (database: Database): Query {
    return (new Query(database))
      .setModel(Model)
      .from(Model.table)
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

    Object.getOwnPropertyNames(this).forEach((key) => {
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
