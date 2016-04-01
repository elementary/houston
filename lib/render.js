/**
 * lib/render.js
 * Formats markdown files with variables
 * Heavly inspired by dondido/express-es6-template-engine
 * Still in testing / expansion. Currently not in use
 *
 * @exports {Function} gatherVariables - Gathers global variables
 * @exports {Function} getTemplate - Finds template realtive to project root
 * @exports {Function} interpolate - Runs function string with given scope
 * @exports {Function} render - Renders file
 */

import fs from 'fs'
import path from 'path'

import * as helpers from './helpers'
import config from './config'

/**
 * gatherVariables
 * Gathers all variables passed onto template
 *
 * @param {Object} local - any locally passed variables
 * @returns {Object} - object extended with global variables
 */
export function gatherVariables (local = {}) {
  return Object.assign(helpers, { config }, local)
}

/**
 * getTemplate
 * Finds template file, relative to project root
 *
 * @param {String} filePath - path to template, relative to project root
 * @returns {Promise} - raw file contents
 */
export function getTemplate (filePath) {
  if (typeof filePath !== 'string') {
    return Promise.reject('getTemplate requires a path relative to project root')
  }

  if (filePath.substring(1) === '~') {
    filePath = path.resolve(config.houston.root, filePath.substring(2, -1))
  } else if (filePath.substring(1) !== '/') {
    filePath = path.resolve(config.houston.root, filePath)
  }

  return new Promise((resolve, reject) => {
    try {
      resolve(fs.readFileSync(filePath, 'utf8'))
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * interpolate
 * Runs given string function with given scope
 *
 * @param {String} fn - function given as a string
 * @param {Object} scope - given paramiters to the function
 * @returns {Blob} - returned value of function
 */
export function interpolate (fn, scope) {
  return new Function(Object.keys(scope), 'return `' + fn + '`').apply(null, Object.values(scope)) //eslint-disable-line
}

/**
 * render
 * Renders markdown
 *
 * @param {String} filePath - path to file, relative to project root
 * @param {Object} variables - all variables to included in template
 * @returns {Promise} - markdown file string after templated
 */
export function render (filePath, variables) {
  const vars = gatherVariables(variables)

  return getTemplate(filePath)
  .then((raw) => {
    return raw.replace(/\{\{\s(.*)\s\}\}/g, (...args) => {
      return interpolate('${ ' + args[1] + ' }', vars)
    })
  })
}
