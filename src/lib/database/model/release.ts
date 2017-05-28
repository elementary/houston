/**
 * houston/src/lib/database/model/release.ts
 * The master model for releases
 */

import { Database } from '../database'
import { Model } from './model'

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
export class Release extends Model {

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
   * findByNameDomainAndVersion
   * Finds a release by the project name domain and release version
   *
   * @param {Database} database - The database connection to use
   * @param {string} name - The domain name for the project
   * @param {string} version - The version string that identifies the release
   * @return {Release|null}
   */
  public static async findByNameDomainAndVersion (
    database: Database,
    name: string,
    version: string
  ): Promise<Release|null> {
    return this.query(database, (q) => {
      return q
        .select('releases.*')
        .leftJoin('projects', 'projects.id', 'releases.project_id')
        .where('releases.deleted_at', null)
        .where('projects.deleted_at', null)
        .where('releases.version', version)
        .where('projects.name_domain', name)
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
  public static async findNewestReleased (database: Database, limit = 10, offset = 0): Promise<Release[]> {
    return this.query(database, (q) => {
      return q
        .select('releases.*')
        .leftJoin('projects', 'releases.project_id', 'projects.id')
        .leftJoin('builds', 'releases.id', 'builds.release_id')
        .where('projects.deleted_at', null)
        .where('releases.deleted_at', null)
        .where('builds.deleted_at', null)
        .where('builds.status', 'publish')
        .orderBy('releases.created_at', 'desc')
        .groupBy('projects.id')
        .limit(limit)
        .offset(offset)
    })
  }
}
