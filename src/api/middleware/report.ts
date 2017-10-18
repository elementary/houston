/**
 * houston/src/lib/server/middleware/report.ts
 * Catches and reports errors.
 */

import { Context } from 'koa'

import { Config } from '../../lib/config'
import { transform } from '../error/transform'

/**
 * Factory function for middleware that catches errors
 *
 * @param {Config} config
 * @return {Function}
 */
export function report (config: Config) {

  /**
   * Reports error logs
   *
   * @async
   * @param {Context} context
   * @return {Function}
   */
  return async (ctx: Context, next: (ctx?: Context) => Promise<void>) => {
    try {
      await next(ctx)
    } catch (e) {
      transform(e).apiRender(ctx)
    }
  }
}
