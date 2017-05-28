/**
 * houston/src/api/controller/newest/project.ts
 * Lists the newest released applications to houston
 *
 * @export {Controller} NewestProject - Lists the newest released application
 */

import { Project } from '../../../lib/database/model/project'
import { Controller } from '../../../lib/server/controller/controller'
import { Context } from '../../../lib/server/middleware'

/**
 * NewestProject
 * Lists the newest released applications to houston
 */
export class NewestProject extends Controller {

  /**
   * view
   * Returns a list of the newest projects that have been released
   *
   * @param {Context} ctx
   * @return {void}
   */
  public async view (ctx: Context) {
    const projects = await Project.findNewestReleased(this.database)
    const appstreamNames = projects.map((project) => project.nameAppstream)

    ctx.status = 200
    ctx.body = {
      data: appstreamNames
    }
  }
}
