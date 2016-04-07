/**
 * lib/helpers/structure.js
 * Random object and array functions
 *
 * @exports {Function} flatten - Flattens object into array
 */

import _ from 'lodash'

/**
 * Flatten
 * Flattens object into array
 *
 * @param {Object} obj - object to be flattened
 * @param {Object} test - testing function
 * @returns {Array} - array of flattened object
 */
export function flatten (obj, test) {
  const data = []

  data.push(_.filter(obj, (tObj) => {
    if (tObj == null) return false
    for (const k in test) {
      if (!test(tObj[k])) return false
      return true
    }
  }))

  for (const k in obj) {
    if (typeof obj[k] === 'object') data.push(flatten(obj[k], test))
  }

  return _.flatten(data)
}
