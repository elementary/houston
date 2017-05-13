/**
 * houston/src/lib/config/loader.ts
 * This file is responsible for loading the configuration file.
 *
 * @exports {Function} environmentToDot
 * @exports {Function} findEnvironmentConfig
 * @exports {Function} findProgramConfig
 * @exports {Function} findFileConfig
 */

import * as fs from 'fs'
import * as path from 'path'

import { Config } from './class'

/**
 * The prefix required for environment variables to be used.
 *
 * @var string
 */
const environmentPrefix = 'HOUSTON'

/**
 * environmentToDot
 * Transforms an environmental variable name to dot notation.
 *
 * @example `HOUSTON_LOG_LEVEL` to `log.level`
 *
 * @param {string} str - The string to transform
 * @return {string}
 */
export function environmentToDot (str: string): string {
  return str
    .toLowerCase()
    .split('_')
    .splice(1)
    .join('.')
}

/**
 * findEnvironmentConfig
 * Finds all the environment variables set and returns a built config.
 *
 * @return {Config}
 */
export function findEnvironmentConfig (): Config {
  const config = new Config()

  Object.keys(process.env).forEach((key) => {
    if (key.startsWith(environmentPrefix)) {
      const name = environmentToDot(key)

      const numberValue = Number(process.env[key])

      if (isNaN(numberValue) === false) {
        config.set(name, numberValue)
      } else {
        config.set(name, process.env[key])
      }
    }
  })

  // Some special case variables
  if (process.env.NODE_ENV != null) {
    config.set('env', process.env.NODE_ENV)
  }

  return config
}

/**
 * findProgramConfig
 * Returns a built config with program variables like git commit and package
 * version.
 *
 * @return {Config}
 */
export function findProgramConfig (): Config {
  const config = new Config()

  try {
    const pkg = require('../../../package.json')

    const [major, minor, patch] = pkg.version.split('-')[0].split('.')

    config.set('houston.version', pkg.version)
    config.set('houston.major', major)
    config.set('houston.minor', minor)
    config.set('houston.patch', patch)
  } catch (e) {} // tslint:disable-line no-empty

  try {
    const gitCommitPath = path.resolve(__dirname, '..', '..', '..', '.git', 'ORIG_HEAD')
    const exists = fs.statSync(gitCommitPath).isFile()

    if (exists === true) {
      const commit = fs.readFileSync(gitCommitPath, {
        encoding: 'utf8'
      }).trim()

      config.set('houston.commit', commit)
    }
  } catch (e) {} // tslint:disable-line no-empty

  try {
    const gitChangePath = path.resolve(__dirname, '..', '..', '..', '.git', 'COMMIT_EDITMSG')
    const exists = fs.statSync(gitChangePath).isFile()

    if (exists === true) {
      const change = fs.readFileSync(gitChangePath, {
        encoding: 'utf8'
      }).trim()

      config.set('houston.change', change)
    }
  } catch (e) {} // tslint:disable-line no-empty

  return config
}

/**
 * findFileConfig
 * Tries to read configuration from a file.
 *
 * @param {string} p - The path to the file
 *
 * @throws {Error} - On 404 file not found
 * @return {Config}
 */
export function findFileConfig (p: string): Config {
  let data = {}

  if (p.startsWith('/')) {
    data = require(p) // tslint:disable-line non-literal-require
  } else {
    const relativeP = path.resolve(process.cwd(), p)
    data = require(relativeP) // tslint:disable-line non-literal-require
  }

  return new Config(data)
}
