/**
 * lib/request.js
 * Wrapper for superagent to support promises
 *
 * @exports {Object} default - a simple superagent function
 * @exports {Function} domain - a superagent function for a whole domain
 * @exports {Function} pagination -  Runs a superagent request repeatetly
 */

import { cloneDeep } from 'lodash'
import { METHODS } from 'http'
import superagent from 'superagent'

// Once upon a time, when superagent wasn't as cool, we had to use plugins for
// the most basic of things. Things like promise support. Then our salvation
// came in the form of @next. Now we no longer need to use plugins for promise
// support. We like to keep this file here as a reminder of a time less awesome.
// RIP need for superagent promise plugins (2016-2016)

/**
 * domain
 * Prefixes a superagent request with url and gives a domain wide use function
 * Useful for services which domain names don't change a middleware runs often
 *
 * @param {String} url - the domain url
 * @returns {Object} - a superagent request object
 */
export function domain (url) {
  const req = cloneDeep(superagent)

  req.prefix = url
  req.uses = []

  /**
   * use
   * Runs a function for each domain request
   *
   * @param {Function} fn - function to run with req as parameter
   * @return {Object} - superagent request object
   */
  req.use = (fn) => {
    req.uses.push(fn)
    return req
  }

  METHODS.forEach((method) => {
    method = method.toLowerCase()
    if (req[method] == null) return

    req[method] = (...args) => {
      const request = superagent[method].apply(req, args)

      if (request.url[0] === '/') request.url = `${req.prefix}${request.url}`

      req.uses.forEach((fn) => {
        request.use(fn)
      })

      return request
    }
  })

  return req
}

/**
 * pagination
 * Runs a superagent request repeatetly until no other pagination links exist
 *
 * @param {Object} req - superagent request object to iterate over
 *
 * @throws {ServiceError} - if the body response is not an array
 * @return {Object} - the last response object with combined body array
 */
export async function pagination (req) {
  if (req.pagination_cache == null) req.pagination_cache = []

  let page = (req.qs != null && req.qs.page != null) ? req.qs.page : 1

  const res = await req
  .query({ page })

  if (!Array.isArray(res.body)) {
    throw new Error('Tried to pagination on non array response body')
  }

  req.pagination_cache.push(...res.body)

  if (res.links.next == null) {
    return Object.assign(res, { body: req.pagination_cache })
  }

  page++

  return pagination(req.query({ page }))
}

export default superagent
