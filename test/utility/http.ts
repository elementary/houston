/**
 * houston/test/utility/http.ts
 * Utilities for when you are testing http related things
 */

import * as nock from 'nock'
import * as path from 'path'

nock.back.fixtures = path.resolve(__dirname, '../fixture')

export interface INockOptions {
  ignoreBody?: boolean
}

/**
 * Sets up nock to record all API calls in the test.
 *
 * @param {String} p Path of the mock
 * @param {INockOptions} opts
 * @return {Object}
 * @return {Function} done - The function to run to stop mocking
 */
export async function record (p: string, opts?: INockOptions) {
  const options: any = {} // tslint:disable-line no-any

  if (opts != null && opts.ignoreBody === true) {
    options.before = (scope) => {
      scope.filteringRequestBody = () => '*'
    }
  }

  const { nockDone } = await nock.back(p, options)

  return { done: nockDone }
}
