/**
 * lib/request.js
 * Wrapper for superagent to support promises
 *
 * @exports {Object} default - a simple superagent function
 * @exports {Function} domain - a superagent function for a whole domain
 */

import _ from 'lodash'
import http from 'http'
import superagent from 'superagent'

// Once upon a time, when superagent wasn't as cool, we had to use plugins for
// the most basic of things. Things like promise support. Then our salvation
// came in the form of @next. Now we no longer need to use plugins for promise
// support. We like to keep this file here as a reminder of a time less awesome.
// RIP need for superagent promise plugins (2016-2016)

export default superagent

/**
 * domain
 * Prefixes a superagent request with url and gives a domain wide use function
 * Useful for services which domain names don't change a middleware runs often
 *
 * @param {String} url - the domain url
 * @returns {Object} - a superagent request object
 */
export function domain (url) {
  const req = _.cloneDeep(superagent)

  req.prefix = url
  req.uses = []

  req.use = (fn) => {
    req.uses.push(fn)
    return req
  }

  http.METHODS.forEach((method) => {
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
