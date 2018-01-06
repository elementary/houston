/**
 * houston/src/lib/database/model/base/query.ts
 * Sets up some cool methods and overwrites then function for casting to model
 */

import * as Builder from 'knex/lib/query/builder'

import { Database } from '../../database'
import { Model } from './model'

export class Query extends Builder {

  /**
   * A database client instance to use
   *
   * @var {Database}
   */
  protected database: Database

  /**
   * Model to cast to when query is finished
   *
   * @var {ModelConstructor}
   */
  protected model

  /**
   * Creates a new Query instance
   *
   * @param {Database} database
   */
  constructor (database: Database) {
    super(database.knex.client)

    return this
  }

  /**
   * Sets the castFromDatabase function for the query
   *
   * @param {ModelConstructor} model
   * @return {Query}
   */
  public setModel (model) {
    this.model = model

    this.from(model.table)

    return this
  }

  /**
   * Sets up the query, runs it, then casts it to a model
   *
   * @return {Model|Model[]|Object|null}
   */
  public then (onResolve, onReject) {
    this.client
      .runner(this)
      .run()
      .then((results) => {
        if (this.model == null) {
          return results
        }

        if (results == null) {
          return null
        }

        if (Array.isArray(results)) {
          return results.map((result) => this.model.castFromDatabase(result))
        } else {
          return this.model.castFromDatabase(results)
        }
      })
      .then(onResolve, onReject)
  }

}
