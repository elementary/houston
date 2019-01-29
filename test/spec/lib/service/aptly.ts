/**
 * houston/test/spec/lib/service/aptly.ts
 * Tests the Aptly class.
 */

import baseTest, { TestInterface } from 'ava'
import * as path from 'path'

import { App } from '../../../../src/lib/app'
import { Config } from '../../../../src/lib/config'
import { Aptly, createUrl } from '../../../../src/lib/service/aptly'
import * as type from '../../../../src/lib/service/type'

import { create } from '../../../utility/app'
import { record } from '../../../utility/http'

const test = baseTest as TestInterface<{
  app: App
}>

test.beforeEach(async (t) => {
  t.context.app = await create()
})

const DEFAULT_PKG: type.IPackage = {
  architecture: 'amd64',
  distribution: 'xenial',
  name: 'package',
  path: path.resolve(__dirname, '../../../test/fixture/lib/service/github/vocal.deb'),
  type: 'deb'
}

test('createUrl removes undefined values', (t) => {
  t.is(createUrl('test', null, 'things', undefined, 5), 'test/things/5')
})

test('resolves aptly details from a config string', (t) => {
  const config = t.context.app.get(Config)

  config.unfreeze()
  config.set('service.aptly.review', 'prefix')
  config.freeze()

  const aptly = t.context.app.get(Aptly)
  const details = aptly.getAptlyDetails(DEFAULT_PKG, 'review')

  t.is(details.prefix, 'prefix')
})

test('resolves aptly details from a config function', (t) => {
  const config = t.context.app.get(Config)

  config.unfreeze()
  config.set('service.aptly.review', () => ({
    architectures: ['architecture'],
    distribution: 'distribution',
    prefix: 'prefix'
  }))
  config.freeze()

  const aptly = t.context.app.get(Aptly)
  const details = aptly.getAptlyDetails(DEFAULT_PKG, 'review')

  t.true(details.architectures.indexOf('architecture') !== -1)
  t.is(details.distribution, 'distribution')
  t.is(details.prefix, 'prefix')
})
