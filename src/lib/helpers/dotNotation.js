/**
 * lib/helpers/dotNotation.js
 * Changes objects between dot notation and expanded form
 *
 * @exports {Function} toDot - transforms object to dot notation
 * @exports {Function} toObj - transforms dot notation to expanded form
 */

import _ from 'lodash'

/**
 * toDot
 * transforms object to dot notation
 *
 * @param {Object} obj - object to transform
 * @param {String} div - sperator for iteration, defaults to '.'
 * @param {String} pre - prefix to attach to all dot notation strings
 * @returns {Object} - dot notation
 */
export function toDot (obj, div = '.', pre) {
  if (typeof obj !== 'object') {
    throw new Error('toDot requires a valid object')
  }

  if (pre != null) {
    pre = pre + div
  } else {
    pre = ''
  }

  const iteration = {}

  Object.keys(obj).forEach((key) => {
    if (_.isPlainObject(obj[key])) {
      Object.assign(iteration, toDot(obj[key], div, pre + key))
    } else {
      iteration[pre + key] = obj[key]
    }
  })

  return iteration
}

/**
 * toObj
 * transforms dot notation to expanded form
 *
 * @param {Object} dot - dot form object to transform
 * @param {String} div - seperator for iteration, defaults to '.'
 * @returns {Object} - expanded form object
 */
export function toObj (dot, div = '.') {
  const iteration = {}
  const uniterated = {}

  Object.keys(dot).forEach((key) => {
    if (key.indexOf(div) === -1) {
      iteration[key] = dot[key]
    } else {
      const keyArray = key.split(div)

      if (uniterated[keyArray[0]] == null) {
        uniterated[keyArray[0]] = {}
      }

      uniterated[keyArray[0]][keyArray.splice(1).join(div)] = dot[key]
    }
  })

  Object.keys(uniterated).forEach((key) => {
    iteration[key] = toObj(uniterated[key], div)
  })

  return iteration
}
