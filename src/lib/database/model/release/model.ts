/**
 * houston/src/lib/database/model/release/model.ts
 * All the information about a project release
 */

import { Database } from '../../database'
import { Model as BaseModel } from '../base/model'
import { Query } from './query'

/**
 * Release
 * The main release model.
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
  protected static table = 'releases'

  public version: string
  public versionMajor: number
  public versionMinor: number
  public versionPatch: number
  public versionBuild: number

  public isPrerelease: boolean

  public releaseableId: string
  public releaseableType: string

  public projectId: string

  /**
   * query
   * This is a super master query function so we can put data in a model
   *
   * @param {Database} database - The database to query
   * @return {Model|Model[]|null}
   */
  public static query (database: Database): Promise<Model|Model[]|null> {
    return new Query(database)
      .setModel(Model)
      .from(Model.table)
  }
}
