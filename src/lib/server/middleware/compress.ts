/**
 * houston/src/lib/server/middleware/compress.ts
 * Compresses the output of the page.
 */

import { Context } from 'koa'
import * as compress from 'koa-compress'

/**
 * Compresses output of the page.
 *
 * @var {compress}
 */
export const compress = compress()
