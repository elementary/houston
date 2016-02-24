/**
 * app/helpers.js
 * Useful functions avalible everywhere in Houston
 *
 * @exports {Function} pluralize
 * @exports {Function} arrayString
 * @exports {Function} flattenObject
 */

import _ from 'lodash'

/**
 * Pluralize
 * Gives a plural or singular string based on array length, includes length of array
 *
 * @param {String} string - String to be pluralized ('error')
 * @param {Array/Number} len - What to base pluralization on
 * @returns {String} - String based on length of array without length ('errors')
 */
export function Pluralize (string, len) {
  let plural = true
  if (typeof len === 'number' && len === 1) plural = false
  if (_.isArray(len) && len.length === 1) plural = false

  // Change tense of 'are' or 'is' based on length
  if (/\s/.test(string)) {
    string = string.split(' ')
    for (let i in string) {
      if (string[i] === 'are' || string[i] === 'is') {
        string[i] = (plural) ? 'are' : 'is'
      } else {
        if (string[i].slice(-1) === 's') string[i] = string[i].splice(0, -1)
        string[i] = (plural) ? `${string[i]}s` : string[i]
      }
    }
    string = string.join(' ')
  } else {
    if (string.slice(-1) === 's') string = string.splice(0, -1)
    string = (plural) ? `${string}s` : string
  }

  return string
}

/**
 * ArrayString
 * Gives a plural or singular string based on array length, includes length of array
 *
 * @param {String} string - String to be pluralized ('error')
 * @param {Array/Number} len - What to base pluralization on
 * @returns {String} - String based on length of array including length ('5 errors')
 */
export function ArrayString (string, len) {
  if (typeof len === 'number') return `${len} ${Pluralize(string, len)}`
  if (_.isArray(len)) return `${len.length} ${Pluralize(string, len)}`

  return `${string}s`
}

/**
 * FlattenObject
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
