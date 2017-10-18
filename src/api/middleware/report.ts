/**
 * houston/src/lib/server/middleware/report.ts
 * Catches and reports errors.
 */

import { Context } from 'koa'

import { transform } from '../error/transform'

/**
 * Reports error logs
 *
 * @async
 * @param {Context} context
 * @return {Function} - A compression function
 */
export async function report (ctx: Context, next: (ctx?: Context) => Promise<void>) {
  try {
    await next(ctx)
  } catch (e) {
    transform(e).apiRender(ctx)
  }
}
