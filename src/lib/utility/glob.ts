/**
 * houston/src/lib/utility/glob.ts
 * Promiseifies the glob package function
 */

import * as Glob from 'glob'

/**
 * A promise-ify passthrough function for glob
 *
 * @async
 *
 * @param {String} pattern
 * @param {Object} [options]
 *
 * @return {String[]}
 */
export function glob (pattern, options = {}) {
  return new Promise((resolve, reject) => {
    Glob(pattern, options, (err, res) => {
      if (err != null) {
        return reject(err)
      } else {
        return resolve(res)
      }
    })
  })
}
