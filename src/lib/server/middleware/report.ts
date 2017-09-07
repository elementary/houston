/**
 * houston/src/lib/server/middleware/report.ts
 * Catches and reports errors.
 */

import { Context } from 'koa'

import { transform } from '../error/transform'

/**
 * Reports error logs
 *
 * @param {Context} context
 * @return {Function} - A compression function
 */
export function report (ctx: Context, next: () => Promise<void>) {
  try {
    next()
  } catch (e) {
    const error = transform(e)

    ctx.status = error.status()
    error.render(ctx)
  }
}
