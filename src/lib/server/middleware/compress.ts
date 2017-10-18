/**
 * houston/src/lib/server/middleware/compress.ts
 * Compresses the output of the page.
 */

import { Context } from 'koa'
import * as Compress from 'koa-compress'

import { Config } from '../../config'

/**
 * Compresses output of the page.
 *
 * @var {Function} - A server middleware factory for compressing things
 */
export const compress = (config: Config) => Compress()
