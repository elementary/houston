/**
 * houston/test/utililty/worker/storage.ts
 * Helpful functions to test the worker process storage
 */

import { defaultsDeep } from 'lodash'

import { Storable } from '../../../src/worker/type'

/**
 * Creates a new Storable object for testing.
 *
 * @param {Object} [override]
 *
 * @return {Storable}
 */
export function storage (override = {}) {
  const def: Storable = {
    appcenter: {},
    appstream: {},
    architecture: 'amd64',
    changelog: [],
    distribution: 'loki',
    logs: [],
    nameAppstream: 'io.elementary.houston.desktop',
    nameDeveloper: 'elementary',
    nameDomain: 'io.elementary.houston',
    nameHuman: 'Houston',
    packageSystem: 'deb',
    references: ['refs/heads/master'],
    version: '0.0.1'
  }

  return defaultsDeep({}, override, def)
}
