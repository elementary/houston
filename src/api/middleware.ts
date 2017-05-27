/**
 * houston/src/api/middleware.ts
 * Middleware specific to the API endpoints
 *
 * @export {Function} catchError - Sets the body to a nice API error
 * @export {Function} checkHeaders - Checks headers for JSON api requirements
 * @export {Function} wrapBody - Sets common API endpoint properties
 */

import * as serverError from '../lib/server/error'
import { convertError } from '../lib/server/errorConverter'
import * as middleware from '../lib/server/middleware'
import { Api as Server } from './api'
import * as payload from './payload'

// Due to the nature of Koa's middleware, we allow assigning any
// tslint:disable no-any

/**
 * catchError
 * Sets the body to a nice API error
 *
 * @param {Server} _ - The server that throws errors
 * @return {Function} - A listener function
 */
export function catchError (server: Server) {

  /**
   * Trys to catch any unset errors
   *
   * @param {Context} ctx - A Server context
   * @param {Function|null} next - THe next item in line
   *
   * @return {void}
   */
  return async (ctx: middleware.Context, next: () => Promise<any>) => {
    try {
      await next()
    } catch (err) {
      middleware.logError(err, ctx.log || server.log)

      const convertedError = convertError(err)

      const errorBody: payload.Error = {
        status: convertedError.status,
        title: convertedError.message
      }

      if (server.config.get('environment', 'production') === 'development') {
        if (err.message != null) {
          errorBody.detail = err.message
        }
      }

      if (convertedError instanceof serverError.ParameterError) {
        errorBody.source = {
          parameter: convertedError.parameter
        }
      } else if (convertedError instanceof serverError.AttributeError) {
        errorBody.source = {
          pointer: convertedError.attribute
        }
      }

      const response: payload.Response = {
        errors: [errorBody]
      }

      ctx.status = errorBody.status
      ctx.body = response
    }
  }
}

/**
 * checkHeaders
 * Checks headers for JSON api requirements
 *
 * @param {Server} _ - The server that throws errors
 * @return {Function} - A listener function
 */
export function checkHeaders (_: Server) {

  /**
   * Checks headers for incomming requests
   *
   * @param {Context} ctx - A Server context
   * @param {Function|null} next - THe next item in line
   *
   * @return {void}
   */
  return async (ctx: middleware.Context, next: () => Promise<any>) => {
    if (ctx.is('application/vnd.api+json') === false) {
      throw new serverError.ServerError('Invalid request headers', 415)
    }

    if (ctx.accepts('application/vnd.api+json') === false) {
      throw new serverError.ServerError('Request does not accept correct type', 406)
    }

    return next()
  }
}

/**
 * wrapBody
 * Sets common API endpoint properties
 *
 * @param {Server} _ - The server that throws errors
 * @return {Function} - A listener function
 */
export function wrapBody (server: Server) {

  /**
   * Wraps body content for common properties
   *
   * @param {Context} ctx - A Server context
   * @param {Function|null} next - THe next item in line
   *
   * @return {void}
   */
  return async (ctx: middleware.Context, next: () => Promise<any>) => {
    await next()

    if (ctx.body == null) ctx.body = {}

    const response: payload.Response = ctx.body

    if (response.meta == null) response.meta = {}
    if (response.meta.date == null) response.meta.date = new Date()
    if (server.config.has('houston.commit')) response.meta.version = server.config.get('houston.commit')
    if (server.config.has('houston.version')) response.meta.version = server.config.get('houston.version')
    response.meta.environment = server.config.get('houston.environment', 'development')

    if (response.links == null) response.links = {}
    if (response.links.self == null) response.links.self = ctx.request.href

    if (response.jsonapi == null) response.jsonapi = {}
    if (response.jsonapi.version == null) response.jsonapi.version = '1.0'

    ctx.type = 'application/vnd.api+json'
    ctx.body = response
  }
}
