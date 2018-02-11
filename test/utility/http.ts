/**
 * houston/test/utility/http.ts
 * Utilities for when you are testing http related things
 */

import * as nock from 'nock'
import * as path from 'path'

nock.back.fixtures = path.resolve(__dirname, '../fixture')

/**
 * Sets up nock to record all API calls in the test.
 *
 * @param {string} p - Path of the mock
 * @return {Object}
 * @return {Function} done - The function to run to stop mocking
 */
export async function record (p: string) {
  const { nockDone } = await nock.back(p)

  return { done: nockDone }
}
