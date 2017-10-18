/**
 * houston/src/api/middleware/setResponse.ts
 * Sets response headers based on JSON API spec
 */

import { Context } from 'koa'
import { get, set } from 'lodash'

import { Config } from '../../lib/config'
import { upsert } from '../../lib/utility'
import { Response } from '../payload'

/**
 * setResponse
 * Sets the JSON API response type
 *
 * @param {Config} config
 *
 * @return {Function} - A middleware function
 */
export function setResponse (config: Config) {

  /**
   * Sets the JSON API response type
   *
   * @param {Context} ctx - A Server context
   * @param {Function|null} next - The next item in line
   *
   * @return {void}
   */
  return async (ctx: Context, next: (ctx: Context) => Promise<void>) => {
    ctx.response.body = {}
    ctx.response.type = 'application/vnd.api+json'

    const response: Response = ctx.body

    // Upsert the meta with useful houston related information
    upsert(response, 'meta.data', new Date())
    upsert(response, 'meta.environment', config.get('houston.environment', 'development'))

    if (config.has('houston.commit')) {
      upsert(response, 'meta.version', config.get('houston.commit'))
    } else if (config.has('houston.version')) {
      upsert(response, 'meta.version', config.get('houston.version'))
    }

    // Upsert some basic pagination links
    upsert(response, 'links.self', ctx.request.href)

    // Upsert some json api related information just in case
    upsert(response, 'jsonapi.version', '1.0')

    return next(ctx)
  }
}
