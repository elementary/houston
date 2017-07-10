/**
 * houston/test/utility/jasmine.ts
 * Usefull functions for changing the tests themself
 *
 * @exports {Function} timeout - Changes test timeout time
 */

/**
 * timeout
 * Changes test timeout time
 *
 * @param {number} minutes - The amount of minutes to wait for test timeout
 * @return {void}
 */
export function timeout (minutes: number) {
  const ms = (minutes * 60 * 60)

  if (jasmine.DEFAULT_TIMEOUT_INTERVAL < ms) {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = ms
  }
}
