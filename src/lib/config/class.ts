/**
 * houston/src/lib/config/class.ts
 * The application wide configuration class
 *
 * @exports {class} config - Global configuration class
 */

import { get, has, isPlainObject, merge, set } from 'lodash'

/**
 * Config
 * An easy to use application wide configuration class
 */
export class Config {

  /**
   * tree
   * The current configuration object
   *
   * @var {object}
   */
  private tree: object

  /**
   * immutable
   * True if we do not allow setting of values anymore
   *
   * @var {boolean}
   */
  private immutable: boolean

  /**
   * freeze
   * Freezes an object
   *
   * @param {object} obj - The object to freeze
   * @return {object} - A newly frozen object
   */
  private static freeze (obj: object): object {
    const newObject = {}

    Object.getOwnPropertyNames(obj).forEach((key) => {
      if (isPlainObject(obj[key])) {
        newObject[key] = this.freeze(obj[key])
      } else {
        newObject[key] = obj[key]
      }
    })

    return Object.freeze(newObject)
  }

  /**
   * unfreeze
   * Makes an object unfrozzen and able to accept new values
   *
   * @param {object} obj - The object to unfreeze
   * @return {object} - A new unfrozzen object
   */
  private static unfreeze (obj: object): object {
    const newObject = {}

    Object.getOwnPropertyNames(obj).forEach((key) => {
      if (typeof obj[key] === 'object') {
        newObject[key] = this.unfreeze(obj[key])
      } else {
        newObject[key] = obj[key]
      }
    })

    return newObject
  }

  /**
   * Create a new Config class with the given object
   *
   * @param {object} configuration - A basic object to set as config
   */
  constructor (configuration: object = {}) {
    this.tree = configuration
    this.immutable = false
  }

  /**
   * get
   * Returns a configuration value
   *
   * @param {*} key - Key value for the configuration
   * @param {*} def - The default value if configuration does not exist
   * @return {*} - The stored configuration value
   */
  public get (key, def?) {
    if (key === '.') {
      return this.tree
    }

    if (this.has(key) === false) {
      return def
    }

    return get(this.tree, key)
  }

  /**
   * has
   * Returns boolean if value exists in configuration
   *
   * @param {string} key - Dot notation path of configuration value
   * @return {boolean} - True if the configuration has the value
   */
  public has (key: string): boolean {
    return has(this.tree, key)
  }

  /**
   * set
   * Sets a configuration value
   *
   * @param {string} key - Key value to store under
   * @param {*} - The configuration value to store
   * @return {Config} - The configuration after value was set
   */
  public set (key, value): this {
    if (this.immutable === true) {
      return this
    }

    set(this.tree, key, value)

    return this
  }

  /**
   * merge
   * Merges an object with the current configuration
   *
   * @param {object} obj - An object to merge in configuration
   * @return {Config} - The configuration after value was set
   */
  public merge (obj: object): this {
    if (this.immutable === true) {
      return this
    }

    merge(this.tree, obj)

    return this
  }

  /**
   * freeze
   * Makes the configuration immutable
   *
   * @return {Config} - The configuration after being frozen
   */
  public freeze (): this {
    this.immutable = true

    this.tree = Config.freeze(this.tree)

    return this
  }

  /**
   * unfreeze
   * Makes the configuration editable
   *
   * @return {Config} - The configuration after unfrozzen
   */
  public unfreeze (): this {
    this.immutable = false
    this.tree = Config.unfreeze(this.tree)

    return this
  }
}
