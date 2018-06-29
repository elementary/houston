/**
 * houston/test/utililty/worker/context.ts
 * Helpful functions to test the worker process context
 */

import { defaultsDeep } from 'lodash'

import { IContext } from '../../../src/worker/type'

/**
 * Creates a new context object for testing.
 *
 * @param {Object} [override]
 *
 * @return {IContext}
 */
export function context (override = {}) {
  const def: IContext = {
    appcenter: {},
    appstream: '',
    architecture: 'amd64',
    changelog: [],
    distribution: 'loki',
    logs: [],
    nameAppstream: 'io.elementary.houston.desktop',
    nameDeveloper: 'elementary',
    nameDomain: 'io.elementary.houston',
    nameHuman: 'Houston',
    references: ['refs/heads/master'],
    type: 'app',
    version: '0.0.1'
  }

  return defaultsDeep({}, override, def)
}
