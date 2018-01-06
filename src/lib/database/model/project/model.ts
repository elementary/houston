/**
 * houston/src/lib/database/model/project/model.ts
 * The model for projects
 */

import { Database } from '../../database'
import { Model as BaseModel } from '../base/model'
import { Query } from './query'

/**
 * Project
 * The main project model.
 *
 * @property {string} id - The record's ID
 *
 * @property {string} nameDomain - The reverse name schema for the project
 * @property {string} nameHuman - The human readable name for a project
 * @property {string} nameDeveloper - The name of the developer
 *
 * @property {string} type - The type of project
 *
 * @property {string} projectableId - The ID of the third party service
 * @property {string} projectableType - The name of the third party service
 *
 * @property {string} stripeId - The ID for the stripe record connected
 *
 * @property {Date} createdAt - The date the record was created at
 * @property {Date} updatedAt - The date the record was last updated
 * @property {Date} [deletedAt] - The date the record may have been deleted
 */
export class Model extends BaseModel {

  /**
   * table
   * The table name for the current model
   *
   * @var {string}
   */
  protected static table = 'projects'

  public nameDomain: string
  public nameHuman?: string
  public nameDeveloper?: string

  public type: string

  public projectableId: string
  public projectableType: string

  public stripeId?: string

  /**
   * guarded
   * All properties that should not be included when put to object or json
   *
   * @var {string[]}
   */
  protected guarded = ['stripeId']

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
   * name_appstream
   * Returns the name used when in desktop appstream.
   *
   * @return {string}
   */
  public get nameAppstream (): string {
    return `${this.nameDomain}.desktop`
  }
}
