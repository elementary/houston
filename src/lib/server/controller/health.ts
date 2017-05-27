/**
 * houston/src/lib/server/controller/health.ts
 * Some useful health indicators for servers
 *
 * @export {Controller} Health - The health controller
 */

import { Context } from '../middleware'
import { Controller } from './controller'

/**
 * Health
 * The health controller. Duh.
 */
export class Health extends Controller {

  /**
   * view
   * Returns a 200 for health checking purposes
   *
   * @param {Context} ctx
   * @return {void}
   */
  public view (ctx: Context) {
    ctx.status = 200
  }
}
