/**
 * lib/config/class.js
 * A simple application configuration class
 * NOTE: this file has synchronous file class to allow usage at top of stack
 *
 * @exports {Class} default - a config class
 */

/* eslint-disable no-sync */

import _ from 'lodash'
import fs from 'fs'
import path from 'path'

import alias from 'root/.alias'
import pkg from 'root/package.json'

/**
 * Config
 * A simple application configuratino class
 */
export default class Config {

  /**
   * Config
   * creates a new configuration class
   */
  constructor () {
    this.current = {}
    this.file = null

    this.immutable = false
  }

  /**
   * has
   * Checks if the current configuration includes a value
   *
   * @param {String} key - a dot seperated key value for configuration
   * @return {Boolean} - true if it exists
   */
  has (key) {
    if (_.get(this.current, key) == null) return false
    return _.has(this.current, key)
  }

  /**
   * get
   * Returns a configuration value
   *
   * @param {String} key - a dot seperated key value for configuration
   * @returns {*} - configuration value
   */
  get (key) {
    return _.get(this.current, key)
  }

  /**
   * true
   * Returns true if the value is true, else false if the value does not exist
   *
   * @param {String} key - a dot seperated key value for configuration
   * @returns {Boolean} - true if value is true, else false if doesn't exist
   */
  true (key) {
    if (!this.has(key)) return false
    return (this.get(key) === true)
  }

  /**
   * set
   * Sets the configuration value
   *
   * @param {String} key - a dot seperated key value for configuration
   * @param {*} value - configuration value
   * @return {Boolean} - true if set
   */
  set (key, value) {
    if (this.immutable) return false

    _.set(this.current, key, value)
    return true
  }

  /**
   * default
   * Sets a configuration value if it does not already exist
   *
   * @param {String} key - a dot seperated key value for configuration
   * @param {*} value - configuration value
   * @return {Boolean} - true if set
   */
  default (key, value) {
    if (this.immutable) return false

    if (this.has(key)) {
      return false
    }

    return this.set(key, value)
  }

  /**
   * loadGenerated
   * Attempts to load generated or un-human configuration values like git commit,
   * default environment, and inferred values
   *
   * @return {Boolean} - true if generated configuration was set
   */
  loadGenerated () {
    if (this.immutable) return false

    this.default('env', 'production')
    this.default('log', 'warn')
    if (!this.has('server.port')) {
      const url = this.get('server.url') || ''
      const port = url.split(':')[2] || 80
      this.default('server.port', Number(port))
    }

    this.set('houston.root', alias.resolve.alias['root'])
    this.set('houston.version', pkg.version)

    try {
      const gitPath = path.resolve(alias.resolve.alias['root'], '.git', 'ORIG_HEAD')
      const gitExists = fs.statSync(gitPath).isFile()

      if (!gitExists) throw new Error()

      const gitCommit = fs.readFileSync(gitPath, { encoding: 'utf8' }).trim()
      this.set('houston.commit', gitCommit)
    } catch (e) {}

    return true
  }

  /**
   * loadFile
   * Attempts to load a configuration file
   *
   * @param {String} path - full path to configuration file
   * @throws {Error} - if file does not exist
   * @return {Boolean} - true if configuration file was loaded
   */
  loadFile (path) {
    if (this.immutable) return false

    if (!fs.statSync(path).isFile()) {
      throw new Error('Configuration path is not a file')
    }

    const loadedConfiguration = require(path)

    this.file = path
    this.current = _.assignIn(this.current, loadedConfiguration)

    return true
  }

  /**
   * loadEnv
   * Attempts to load any environmental variables set
   *
   * @return {Boolean} - true if environmental variables were loaded
   */
  loadEnv () {
    if (this.immutable) return false

    // All non HOUSTON_ prefixed environmental values
    Object.keys(process.env)
    .forEach((key) => {
      if (key === 'NODE_ENV') this.set('env', process.env[key])

      // Set the port for everything because the key is unspecific
      if (key === 'PORT') {
        this.set('server.port', Number(process.env[key]))
        this.set('downloads.port', Number(process.env[key]))
      }
    })

    // All HOUSTON_ prefixed values
    Object.keys(process.env)
    .filter((key) => (key.toLowerCase().substring(0, 7) === 'houston'))
    .forEach((key) => {
      const configKey = key.toLowerCase().substring(8).replace('_', '.')

      if (configKey === 'server.port' || configKey === 'downloads.port') {
        this.set(configKey, Number(process.env[key]))
      } else {
        this.set(configKey, process.env[key])
      }
    })

    return true
  }

  /**
   * check
   * Attempts to find missing required configuration values
   *
   * @return {String[]} - a list of key values missing from configuration
   */
  check () {
    const missingKeys = []

    /**
     * add
     * Convenient function to check if key exists and add to array of missing Keys
     *
     * @param {String} key - key value to check exists
     * @return {Void}
     */
    const add = (key) => {
      if (!this.has(key)) missingKeys.push(key)
    }

    add('database')
    add('env')
    add('flightcheck.directory')
    add('flightcheck.docker')
    add('rights')
    add('server.secret')
    add('server.url')

    return missingKeys
  }
}
