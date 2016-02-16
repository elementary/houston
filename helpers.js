/**
 * app/helpers.js
 * Useful functions avalible everywhere in Houston
 *
 * @exports {Function} pluralize
 * @exports {Function} arrayString
 * @exports {Function} flattenObject
 */

import _ from 'lodash'

export function Pluralize (string, array) {
  if (_.isArray(array) && array.length === 1) return string

  return `${string}s`
}

export function ArrayString (string, array) {
  if (_.isArray(array)) return `${array.length} ${Pluralize(string, array)}`

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
