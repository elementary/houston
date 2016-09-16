/**
 * lib/helpers/fs.js
 * File system helpers
 *
 * @exports {Function} smartPath - rewrites path based on smart rules
 * @exports {Function} walk - finds all files in directory recursively
 */

import _ from 'lodash'
import path from 'path'
import Promise from 'bluebird'

import config from 'lib/config'

const fs = Promise.promisifyAll(require('fs'))

/**
 * smartPath
 * Rewrite a path based on project root
 *
 * @param {String} directory - raw requested path
 * @param {String} relative - where to base relative paths from
 * @returns {String} - absolute path of file
 */
export function smartPath (directory, relative = module.parent.filename) {
  relative = path.resolve(relative)

  if (path.isAbsolute(directory)) {
    return directory
  }

  if (directory.charAt(0) === '.') {
    return path.resolve(relative, directory)
  }

  return path.resolve(config.houston.root, directory)
}

/**
 * walk
 * Finds all files in directory recursively
 *
 * @param {String} directory - directory to walk relative to project root
 * @param {Function} filter - function to filter items by
 * @param {Number} max - max number iterations function can do
 * @param {Number} iteration - iteration of function
 * @returns {Array} - list of files with full paths relative to directory parameter
 */
export async function walk (directory, filter = () => true, max = 10, iteration = 1) {
  if (typeof directory !== 'string') {
    throw new Error('Walk requires a directory string path')
  }
  if (typeof filter !== 'function') {
    throw new Error('Walk requires a function for filter')
  }

  if (iteration >= max) return []

  directory = smartPath(directory)

  const stat = await fs.statAsync(directory)

  if (!stat.isDirectory()) {
    return new Error('Walk requires a valid directory')
  }

  return fs.readdirAsync(directory)
  .map(async (abstract) => {
    const ePath = path.join(directory, abstract)
    const stat = await fs.statAsync(ePath)

    if (stat.isDirectory()) {
      return walk(ePath, filter, max, iteration + 1)
      .map((file) => path.join(abstract, file))
    }

    return abstract
  })
  .then((files) => {
    files = _.flattenDeep(files)

    if (iteration !== 1) return files
    return _.filter(files, filter)
  })
}

/**
 * mkdirp
 * Ensures given path exists
 *
 * @param {String} directory - directory to ensure exists
 * @returns {Promise} - result of creation
 */
export function mkdirp (directory) {
  directory = smartPath(directory)
  const chunks = directory.split(path.sep)

  return Promise.map(chunks, (chunk, i) => {
    return chunks.slice(0, i + 1).join(path.sep)
  })
  .each((chunk) => {
    if (chunk == null || chunk === '') return
    return fs.mkdirAsync(chunk)
    .catch({ code: 'EEXIST' }, () => true)
  })
}

/**
 * rmp
 * Removes EVERYTHING you ever loved or wanted to keep
 *
 * @param {String} directory - directory to destroy
 * @returns {Promise} - result of destruction
 */
export async function rmp (directory) {
  directory = smartPath(directory)
  const stat = await fs.statAsync(directory)

  if (stat.isFile()) {
    return fs.unlinkAsync(directory)
  } else if (stat.isDirectory()) {
    await Promise.each(fs.readdirAsync(directory), (item) => rmp(path.join(directory, item)))
    return fs.rmdirAsync(directory)
  }
}
