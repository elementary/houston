/**
 * houston/test/e2e/lib/service/aptly.ts
 * Tests the Aptly package repository class.
 */

import { test as baseTest, TestInterface } from 'ava'
import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { App } from '../../../../src/lib/app'
import { Config } from '../../../../src/lib/config'
import * as Log from '../../../../src/lib/log'
import { Aptly } from '../../../../src/lib/service/aptly'
import * as type from '../../../../src/lib/service/type'

import { tmp } from '../../../utility/fs'
import { record } from '../../../utility/http'

const test = baseTest as TestInterface<{
  app: App
}>

const DEFAULT_PKG: type.IPackage = {
  architecture: 'amd64',
  distribution: 'xenial',
  name: 'package',
  path: path.resolve(__dirname, '../../../test/fixture/lib/service/github/vocal.deb'),
  type: 'deb'
}

// To test this: `rm -rf $HOME/.aptly && aptly repo create testing && aptly api serve`
// FIXME: Nock back does not like to match the upload request even when recorded
test.failing('can upload a package to aptly', async (t) => {
  const { done } = await record('lib/service/aptly/asset.json', { ignoreBody: true })
  const config = t.context.app.get(Config)

  config.unfreeze()
  config.set('service.aptly.review', 'testing')
  config.freeze()

  const aptly = t.context.app.get(Aptly)
  const details = await aptly.uploadPackage(DEFAULT_PKG, 'review')

  t.is(details.aptlyId, 'Pamd64 com.github.needle-and-thread.vocal 2.1.6 9a6a0ef178f67a1e')
})
