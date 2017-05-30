/**
 * houston/src/lib/server/middleware.ts
 * Common middleware to be used with the server
 *
 * @exports {Interface} Context - An extended Server context interface
 * @exports {Function} onError - Function for listening to server errors
 */

import * as compress from 'koa-compress'
import * as Router from 'koa-router'

import { Log } from '../log'
import { ServerError } from './error'
import { Server } from './server'

// Due to the nature of Koa's middleware, we allow assigning any
// tslint:disable no-any

/**
 * Context
 * An extended Koa router context with extra functions
 */
export interface Context extends Router.IRouterContext {
  log: Log
}

/**
 * logError
 * Logs an error to the Logger. Uses appropriate level based on status
 *
 * @param {Error} err - The error the be logged
 * @param {Log} log - A Log instance to use
 * @return {void}
 */
export function logError (err: Error, log: Log) {
  // We allow custom values in the error, but don't log the regular stack
  const errorData = Object.assign({}, err)
  delete errorData.message
  delete errorData.stack

  if ((err instanceof ServerError) === false) {
    log.error(err.message, errorData)
    return
  }

  const status = (err as ServerError).status

  if (status >= 500) {
    log.error(err.message, errorData)
  } else {
    log.debug(err.message, errorData)
  }
}

/**
 * onError
 * Reports errors to the console. We let all other errors fall to Koa's default
 * error handling logic.
 *
 * @param {Server} server - The server that throws errors
 * @return {Function} - A listener function
 */
export function onError (server: Server) {

  /**
   * Reports errors to the console
   *
   * @param {Error} err - The error that occured
   * @return {void}
   */
  return (err: Error) => {
    logError(err, server.log)
  }
}

/**
 * Compress
 * Compresses output
 *
 * @param {Server} server - The server that needs compression
 * @return {Function} - A compression function
 */
export function Compress (server: Server) {
  // Disable compression if we are not in production
  if (server.config.get('environment', 'production') !== 'production') {
    return (_, next: () => Promise<any>) => next()
  }

  return compress({})
}

/**
 * Logger
 * Adds a logger for every request
 *
 * @param {Server} server - The server that throws errors
 * @return {Function} - A middleware function
 */
export function Logger (server: Server) {

  /**
   * Adds a new log instance to each request. Has it's own metadata.
   *
   * @param {Context} ctx - A Server context
   * @param {Function|null} next - THe next item in line
   *
   * @return {Function|null} The next item in line to run
   */
   return async (ctx: Context, next: () => Promise<any>) => {
     ctx.log = new Log(server.config)
     return next()
   }
}
