/**
 * app/helpers.js
 * Useful functions avalible everywhere in Houston
 *
 * @exports {Function} pluralize
 * @exports {Function} arrayString
 * @exports {Function} flattenObject
 */

import _ from 'lodash'

export function Pluralize (string, len) {
  if (typeof len === 'number' && len === 1) return string
  if (_.isArray(len) && len.length === 1) return string

  return `${string}s`
}

export function ArrayString (string, len) {
  if (typeof len === 'number') return `${len} ${Pluralize(string, len)}`
  if (_.isArray(len)) return `${len.length} ${Pluralize(string, len)}`

  return `${string}s`
}

/**
 * Flattens object into array
 *
 * @param {Object} obj - Object to be flattened
 * @param {Object} test - Object with typeof value for each key for testing
 */
export function FlattenObject (obj, test) {
  let data = []

  data.push(_.filter(obj, tObj => {
    if (tObj == null) return false
    for (let k in test) {
      if (typeof tObj[k] !== test[k]) return false
      return true
    }
  }))

  for (let k in obj) {
    if (typeof obj[k] === 'object') data.push(FlattenObject(obj[k], test))
  }

  return _.flatten(data)
}
