/**
 * lib/helpers/fs.js
 * File system helpers
 *
 * @exports {Function} smartPath - rewrites path based on smart rules
 * @exports {Function} walk - finds all files in directory recursively
 */

import _ from 'lodash'
import fs from 'fs'
import path from 'path'

import config from '~/lib/config'

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
 * TODO: Promise this whole thing up
 *
 * @param {String} directory - directory to walk relative to project root
 * @param {Function} filter - function to filter items by
 * @returns {Array} - list of files with full paths relative to directory parameter
 */
export function walk (directory, filter = (path) => true) {
  if (typeof directory !== 'string') {
    throw new Error('Walk requires a directory string path')
  }
  if (typeof filter !== 'function') {
    throw new Error('Walk requires a function for filter')
  }

  directory = smartPath(directory, module.parent.filename)

  const stat = fs.statSync(directory)

  if (!stat.isDirectory()) {
    return new Error('Walk requires a valid directory')
  }

  let output = []
  const paths = fs.readdirSync(directory)

  paths.forEach((abstract) => {
    const ePath = path.join(directory, abstract)

    if (fs.statSync(ePath).isDirectory()) {
      output = _.union(output, walk(ePath, filter))
      return
    }

    if (filter(ePath.replace(path.join(config.houston.root, '/'), ''))) {
      output.push(ePath)
      return
    }
  })

  return output.map((out) => out.replace(path.join(config.houston.root, '/'), ''))
}
