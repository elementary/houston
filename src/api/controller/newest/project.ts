/**
 * houston/src/api/controller/newest/project.ts
 * Lists the newest released applications to houston
 *
 * @export {Controller} NewestProject - Lists the newest released application
 */

import { Context } from 'koa'

import { Database } from '../../../lib/database'
import { Project } from '../../../lib/database/model'
import { Controller } from '../../../lib/server/controller'

/**
 * NewestProject
 * Lists the newest released applications to houston
 */
export class NewestProjectController extends Controller {

  /**
   * The URL prefix for this controller
   *
   * @var {String}
   */
  protected prefix = '/newest/project'

  /**
   * A useable database instance.
   *
   * @var {Database}
   */
  protected database: Database

  /**
   * Sets up a database for query
   *
   * @param {Database} database
   */
  public constructor (database: Database) {
    super()

    this.database = database
  }

  /**
   * view
   * Returns a list of the newest projects that have been released
   *
   * @param {Context} ctx
   * @return {void}
   */
  public async view (ctx: Context) {
    const projects = await Project.query(this.database)
      .whereNewestReleased()

    const appstreamNames = projects.map((project) => project.nameAppstream)

    ctx.status = 200
    ctx.body = {
      data: appstreamNames
    }
  }
}
