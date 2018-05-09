/**
 * houston/src/lib/service/aptly.spec.ts
 * Tests the Aptly class.
 */

import * as path from 'path'

import { App } from '../app'
import { Config } from '../config'
import { Aptly } from './aptly'
import * as type from './type'

import { create } from '../../../test/utility/app'
import { record } from '../../../test/utility/http'

const DEFAULT_PKG: type.IPackage = {
  architecture: 'amd64',
  distribution: 'xenial',
  path: path.resolve(__dirname, '../../../test/fixture/lib/service/github/vocal.deb'),
  type: 'deb'
}

let app: App

beforeAll(async () => {
  app = await create()
})

test('resolves aptly details from a config string', () => {
  const config = app.get(Config)

  config.unfreeze()
  config.set('service.aptly.review', 'prefix')
  config.freeze()

  const aptly = app.get(Aptly)
  const details = aptly.getAptlyDetails(DEFAULT_PKG, 'review')

  expect(details.prefix).toBe('prefix')
})

test('resolves aptly details from a config function', () => {
  const config = app.get(Config)

  config.unfreeze()
  config.set('service.aptly.review', () => ({
    architectures: ['architecture'],
    distribution: 'distribution',
    prefix: 'prefix'
  }))
  config.freeze()

  const aptly = app.get(Aptly)
  const details = aptly.getAptlyDetails(DEFAULT_PKG, 'review')

  expect(details.architectures).toContain('architecture')
  expect(details.distribution).toBe('distribution')
  expect(details.prefix).toBe('prefix')
})

// To test this: `rm -rf $HOME/.aptly && aptly repo create testing && aptly api serve`
// FIXME: Nock back does not like to match the upload request even when recorded
test.skip('can upload a package to aptly', async () => {
  const { done } = await record('lib/service/aptly/asset.json', { ignoreBody: true })
  const config = app.get(Config)

  config.unfreeze()
  config.set('service.aptly.review', 'testing')
  config.freeze()

  const aptly = app.get(Aptly)
  const details = await aptly.uploadPackage(DEFAULT_PKG, 'review')

  expect(details.aptlyId).toBe('Pamd64 com.github.needle-and-thread.vocal 2.1.6 9a6a0ef178f67a1e')

  await done()
})
