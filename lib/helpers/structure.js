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
  let data = []

  data.push(_.filter(obj, tObj => {
    if (tObj == null) return false
    for (let k in test) {
      if (!test(tObj[k])) return false
      return true
    }
  }))

  for (let k in obj) {
    if (typeof obj[k] === 'object') data.push(flatten(obj[k], test))
  }

  return _.flatten(data)
}
