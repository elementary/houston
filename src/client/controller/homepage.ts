/**
 * houston/src/client/controller/homepage.ts
 * Shows the houston homepage
 *
 * @export {Controller} Homepage - Shows the houston homepage
 */

import { Controller } from '../../lib/server/controller/controller'
import { Context } from '../middleware'

/**
 * Homepage
 * Shows the houston homepage
 */
export class Homepage extends Controller {

  /**
   * view
   * Returns a list of the newest projects that have been released
   *
   * @param {Context} ctx
   * @return {void}
   */
  public async view (ctx: Context) {
    ctx.status = 302
    return ctx.render('homepage')
  }
}
