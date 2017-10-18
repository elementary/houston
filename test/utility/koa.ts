/**
 * houston/test/utililty/koa.ts
 * Helpful functions to test koa things
 */

import * as Koa from 'koa'
import * as Stream from 'stream'

/**
 * Creates a fake context for testing on
 * I didn't come up with this function, so if something breaks:
 * @see https://github.com/koajs/koa/blob/master/test/helpers/context.js
 *
 * @param {Object} [res]
 * @param {Object} [res]
 * @param {Object} [app]
 *
 * @return {Context}
 */
export function Context (req = {}, res = {}, app = new Koa()) {
  const socket = new Stream.Duplex()

  req = Object.assign({ _headers: {}, socket }, Stream.Readable.prototype, req)
  res = Object.assign({ _headers: {}, socket }, Stream.Writable.prototype, res)

  if (req.headers == null) {
    req.headers = {}
  }

  if (req.socket.remoteAddress == null) {
    req.socket.remoteAddress = '127.0.0.1'
  }

  res.getHeader = (k) => res._headers[k.toLowerCase()]
  res.setHeader = (k, v) => res._headers[k.toLowerCase()] = v
  res.removeHeader = (k) => delete res._headers[k.toLowerCase()]

  return app.createContext(req, res)
}
