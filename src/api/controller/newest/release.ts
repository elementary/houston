/**
 * houston/src/api/controller/newest/release.ts
 * Lists the newest releases grouped by project
 *
 * @export {Controller} NewestProject - Lists the newest releases
 */

import { Context } from 'koa'

import { Database } from '../../../lib/database/database'
import { Project, Release } from '../../../lib/database/model'
import { Controller } from '../../../lib/server/controller'

/**
 * NewestRelease
 * Lists the newest released applications to houston
 */
export class NewestReleaseController extends Controller {

  /**
   * The URL prefix for this controller
   *
   * @var {String}
   */
  protected prefix = '/newest/release'

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
    const releases = await Release.query(this.database)
      .whereNewestReleased()

    const projects = await Project.query(this.database)
      .whereIn('id', releases.map((release) => release.id))

    const appstreamNames = projects.map((project) => project.nameAppstream)

    ctx.status = 200
    ctx.body = {
      data: appstreamNames
    }
  }
}
