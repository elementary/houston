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
 * @param {Object} filter - testing function
 * @returns {Array} - array of flattened object
 */
export function flatten (obj, filter) {
  const data = []

  Object.keys(obj).forEach((key) => {
    if (filter(obj[key])) {
      data.push(obj[key])
    } else if (_.isPlainObject(obj)) {
      data.push(flatten(obj[key], filter))
    }
  })

  return _.flatten(data)
}
