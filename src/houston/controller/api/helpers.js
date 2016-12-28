/**
 * houston/controller/api/helpers.js
 * Some API endpoint helpers
 * NOTE: all functions here throw unspecific errors. They should be wrapped in
 * try blocks for more accurate and useful errors.
 *
 * @exports {Function} nameify - Takes a string and transforms it to a project name
 * @exports {Function} amountify - Takes a string and returns an integer value
 */

import { nameify as nameUpstream } from 'service'
import APIError from './error'

/**
 * nameify
 * Takes a string and transforms it to a project name. Useful to standardize
 * input from endpoints.
 * NOTE: wrap this in a try block to catch errors and rethrow more specific ones
 *
 * @param {String} str - a string to transform
 *
 * @throws {APIError} - when string can not be transformed
 * @returns {String} - a RDNN string that may be a project name
 */
export function nameify (str) {
  if (str == null) {
    throw new APIError(400, 'Invalid Project Name')
  }

  const splits = str.split('.')

  if (splits.length < 3) {
    throw new APIError(400, 'Invalid Project Name')
  }

  return splits.map((s) => nameUpstream(s)).join('.')
}

/**
 * amountify
 * Takes a string and returns an integer value
 * NOTE: wrap this in a try block to catch errors and rethrow more specific ones
 *
 * @param {String} num - a value to transform
 *
 * @throws {APIError} - when string is not a strict integer
 * @returns {Number} - a integer value
 */
export function amountify (num) {
  if (num == null || /\S/.test(num) === false) {
    throw new APIError(400, 'Invalid Number')
  }

  let amount = 0

  try {
    amount = Number(num)
  } catch (err) {
    throw new APIError(400, 'Invalid Number')
  }

  if (isNaN(amount)) {
    throw new APIError(400, 'Invalid Number')
  }

  if (amount % 1 !== 0) {
    throw new APIError(400, 'Invalid Amount')
  }

  return amount
}
