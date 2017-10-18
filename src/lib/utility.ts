/**
 * houston/src/lib/utility.ts
 * Some pure function helpers
 */

import { get, set } from 'lodash'

/**
 * Upserts a value to an object if the key does not already exist.
 *
 * @param {Object} obj - The object to upsert in
 * @param {String} key - The key to check
 * @param {*} value - The value to add if it doesn't exist
 *
 * @return {void}
 */
// tslint:disable-next-line:no-any
export function upsert (obj: object, key: string, value: any) {
  if (get(obj, key, null) == null) {
    set(obj, key, value)
  }
}
