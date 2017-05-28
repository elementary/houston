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

  /**
   * table
   * The table name for the current model
   *
   * @var {string}
   */
  protected static table = 'projects'

  public nameDomain?: string
  public nameHuman?: string
  public nameDeveloper?: string

  public type?: string

  public projectableId?: string
  public projectableType?: string

  public stripeId?: string

  /**
   * guarded
   * All properties that should not be included when put to object or json
   *
   * @var {string[]}
   */
  protected guarded = ['stripeId']

  /**
   * findByNameDomain
   * Finds a project by the name_domain field
   *
   * @param {Database} database - The database connection to use
   * @param {string} name - The domain name for the project
   * @return {Project|null}
   */
  public static async findByNameDomain (database: Database, name: string) {
    return this.query(database, (q) => {
      return q
        .where('name_domain', name)
        .where('deleted_at', null)
        .first()
    })
  }

  /**
   * findNewestReleased
   * Finds the newest projects, that have been released at one point or another.
   * NOTE: this does not give projects with the latest releases. Phrasing.
   *
   * @param {Database} database - The database connection to use
   * @param {number} limit - The amount we should limit results to
   * @param {number} offset - The page we should lookup
   * @return {Project[]}
   */
  public static async findNewestReleased (database: Database, limit = 10, offset = 0) {
    return this.query(database, (q) => {
      return q
        .select('projects.*')
        .leftJoin('releases', 'projects.id', 'releases.project_id')
        .leftJoin('builds', 'releases.id', 'builds.release_id')
        .where('projects.deleted_at', null)
        .where('releases.deleted_at', null)
        .where('builds.deleted_at', null)
        .where('builds.status', 'publish')
        .orderBy('projects.created_at', 'desc')
        .groupBy('projects.id')
        .limit(limit)
        .offset(offset)
    })
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
