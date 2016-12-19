/**
 * houston/controller/api/helpers.js
 * Some API endpoint helpers
 *
 * @exports {Function} nameify - Takes a string and transforms it to a project name
 */

import { nameify as nameUpstream } from 'service'
import APIError from './error'

/**
 * nameify
 * Takes a string and transforms it to a project name. Useful to standardize
 * input from endpoints.
 *
 * @param {String} str - a string to transform
 *
 * @throws {APIError} - when string can not be transformed
 * @returns {String} - a RDNN string that may be a project name
 */
export function nameify (str) {
  const splits = str.split('.')

  if (splits.length < 3) {
    throw new APIError(400, 'Invalid Project Name')
  }

  return splits.map((s) => nameUpstream(s)).join('.')
}
