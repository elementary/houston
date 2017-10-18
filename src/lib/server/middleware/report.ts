/**
 * houston/src/lib/server/middleware/report.ts
 * Catches and reports errors.
 */

import { Context } from 'koa'

import { Config } from '../../config'
import { transform } from '../error/transform'

/**
 * A middleware factory function for reporting errors
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
   * @return {Function} - A compression function
   */
  return async (ctx: Context, next: (ctx?: Context) => Promise<void>) => {
    try {
      await next(ctx)
    } catch (e) {
      transform(e).httpRender(ctx)
    }
  }
}
