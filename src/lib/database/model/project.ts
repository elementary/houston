/**
 * houston/src/lib/database/model/project.ts
 * The super amazing master project model of all that is everything
 */

import { Database } from '../database'
import { Model } from './model'

/**
 * Project
 * The main project model.
 *
 * @property {string} id - The record's ID
 */
export class Project extends Model {

  protected static table = 'projects'

  public nameDomain?: string
  public nameHuman?: string
  public nameDeveloper?: string

  public type?: string

  public projectableId?: string
  public projectableType?: string

  public stripeId?: string|null

  public static async findByNameDomain (database: Database, name: string) {
    const record = await database.knex
      .table(this.table)
      .where('name_domain', name)
      .where('deleted_at', null)
      .first()

    if (record == null) {
      return null
    }

    return this.castFromDatabase(record)
  }
}
