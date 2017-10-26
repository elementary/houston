/**
 * houston/src/api/controller/newest/release.ts
 * Lists the newest releases grouped by project
 *
 * @export {Controller} NewestProject - Lists the newest releases
 */

import { Context } from 'koa'

import { Database } from '../../../lib/database/database'
import { Project } from '../../../lib/database/model/project'
import { Release } from '../../../lib/database/model/release'
import { Controller } from '../../../lib/server/controller'

/**
 * NewestRelease
 * Lists the newest released applications to houston
 */
export class NewestReleaseController extends Controller {

  /**
   * A database we can use for making queries
   *
   * @var {Database}
   */
  protected database: Database

  /**
   * Creates a new controller
   */
  public constructor (database: Database) {
    super()

    this.database = database
  }

  /**
   * view
   * Returns a list of projects that have the latest release
   *
   * @param {Context} ctx
   * @return {void}
   */
  public async view (ctx: Context) {
    const releases = await Release.findNewestReleased(this.database)
    const projects = await Promise.all(releases.map((release) => {
      return Project.findById(this.database, release.projectId)
    }))

    const appstreamNames = projects.map((project) => project.nameAppstream)

    ctx.status = 200
    ctx.body = {
      data: appstreamNames
    }
  }
}
