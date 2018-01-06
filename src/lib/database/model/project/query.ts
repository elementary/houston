/**
 * houston/src/lib/database/model/project/query.ts
 * Sets up some cool methods and overwrites then function for casting to model
 */

import { Query as BaseQuery } from '../base/query'

export class Query extends BaseQuery {

  /**
   * Finds a project by the name_domain field
   *
   * @param {string} name - The domain name for the project
   * @return {Query}
   */
  public whereNameDomain (name: string) {
    return this
      .select('projects.*')
      .where('name_domain', name)
      .first()
  }

  /**
   * Finds the newest projects, that have been released at one point or another.
   * NOTE: this does not give projects with the latest releases. Phrasing.
   *
   * @return {Query}
   */
  public whereNewestReleased () {
    return this
      .select('projects.*')
      .leftJoin('releases', 'projects.id', 'releases.project_id')
      .leftJoin('builds', 'releases.id', 'builds.release_id')
      .where('projects.deleted_at', null)
      .where('releases.deleted_at', null)
      .where('builds.deleted_at', null)
      .where('builds.status', 'publish')
      .orderBy('projects.created_at', 'desc')
      .groupBy('projects.id')
  }

}
