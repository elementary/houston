/**
 * houston/src/api/middleware.ts
 * Middleware specific to the API endpoints
 *
 * @export {Function} catchError - Sets the body to a nice API error
 * @export {Function} checkHeaders - Checks headers for JSON api requirements
 * @export {Function} wrapBody - Sets common API endpoint properties
 */

// Marko requires a runtime library to be able to require raw marko files
import 'marko/node-require'

import * as koaStatic from 'koa-static'
import * as lasso from 'lasso'
import * as path from 'path'
import { createGzip } from 'zlib'

import { convertError } from '../lib/server/errorConverter'
import * as middleware from '../lib/server/middleware'
import { Client as Server } from './client'

// Due to the nature of Koa's middleware, we allow assigning any
// tslint:disable no-any

export interface Context extends middleware.Context {
  render (rel: string, locals?: object): void
}

export interface ErrorResponse {
  status: number
  message: string
  detail?: string
}

/**
 * catchError
 * Sets the body to a nice API error
 *
 * @param {Server} server - The server that throws errors
 * @return {Function} - A middleware function
 */
export function catchError (server: Server) {

  /**
   * Trys to catch any unset errors
   *
   * @param {Context} ctx - A Server context
   * @param {Function|null} next - The next item in line
   *
   * @return {void}
   */
  return async (ctx: Context, next: () => Promise<any>) => {
    try {
      await next()
    } catch (err) {
      middleware.logError(err, ctx.log || server.log)

      const locals: ErrorResponse = convertError(err)

      if (server.config.get('environment', 'production') === 'development') {
        if (err.message != null) {
          locals.detail = err.message
        }
      }

      return ctx.render('error', locals)
    }
  }
}

/**
 * assets
 * Serves a public folder
 *
 * @param {Server} server - The server that throws errors
 * @param {string} folder - The folder to serve from
 * @return {Function} - A middleware function
 */
export function assets (server: Server, folder: string) {
  const maxage = (server.config.get('environment', 'production') === 'production') ? 31536000 : 0

  return koaStatic(folder, {
    defer: false,
    extensions: false,
    gzip: true,
    hidden: false,
    index: false,
    maxage
  })
}


/**
 * render
 * Adds a render function to server context
 *
 * @param {Server} server - The server that can render
 * @return {Function} - A middleware function
 */
export function render (server: Server) {
  const isProduction = (server.config.get('environment', 'production') === 'production')

  lasso.configure({
    bundlingEnabled: isProduction,
    fingerprintsEnabled: isProduction,
    minify: isProduction,
    outputDir: path.resolve(__dirname, 'public', 'bundle'),
    plugins: ['lasso-marko'],
    urlPrefix: '/bundle'
  })

  /**
   * Adds a render function to the server context
   *
   * @param {Context} ctx - A Server context
   * @param {Function|null} next - The next item in line
   *
   * @return {Function|null}
   */
  return async (ctx: Context, next: () => Promise<any>) => {
    ctx.render = (rel: string, locals?: object): void => {
      const fileName = path.join(__dirname, 'page', rel)
      const template = require(fileName) // tslint:disable-line non-literal-require

      if (ctx.status == null) ctx.status = 200
      ctx.type = 'text/html'
      ctx.body = template.stream(locals).on('error', (err) => {
        ctx.log.error(`Error while rendering "${rel}" page template`, err)
      })

      ctx.vary('Accept-Encoding')
      if (ctx.acceptsEncodings('gzip')) {
        ctx.set('Content-Encoding', 'gzip')
        ctx.body = ctx.body.pipe(createGzip())
      }
    }

    return next()
  }
}
