/**
 * houston/test/e2e/lib/service/github.ts
 * Tests the GitHub repository class.
 */

import { test as baseTest, TestInterface } from 'ava'
import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import * as Log from '../../../../src/lib/log'
import { github, IGitHubFactory } from '../../../../src/lib/service/github'
import * as type from '../../../../src/lib/service/type'

import { create as createApp } from '../../../utility/app'
import { tmp } from '../../../utility/fs'
import { record } from '../../../utility/http'

const test = baseTest as TestInterface<{
  folder: string
  factory: IGitHubFactory
}>

test.beforeEach(async (t) => {
  const app = await createApp()

  t.context.folder = await tmp(`lib/service/github/${uuid()}`)
  t.context.factory = (url: string) => {
    const instance = app.get<IGitHubFactory>(github)(url)

    instance.tmpFolder = t.context.folder

    return instance
  }
})

test.afterEach.always(async (t) => {
  await fs.remove(t.context.folder)
})

test.serial('can clone a repository', async (t) => {
  const repo = t.context.factory('https://github.com/elementary/houston')

  const folder = path.resolve(t.context.folder, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/heads/origin/v2')

  const stat = await fs.stat(folder)
  t.true(stat.isDirectory())
})

test.serial('can clone a repository with tag', async (t) => {
  const repo = t.context.factory('https://github.com/elementary/houston')

  const folder = path.resolve(t.context.folder, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/tags/0.2.0')

  const stat = await fs.stat(folder)
  t.true(stat.isDirectory())

  // tslint:disable-next-line non-literal-require
  const pkg = require(path.resolve(folder, 'package.json'))
  t.is(pkg.version, '0.1.8')
})

test.serial('can clone a repository with a non-annotated tag (#511)', async (t) => {
  const repo = t.context.factory('https://github.com/fluks-eos/gdice')

  const folder = path.resolve(t.context.folder, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/tags/v1.0.1')

  const stat = await fs.stat(folder)
  t.true(stat.isDirectory())
})

test.serial('can list all references for a repository', async (t) => {
  const repo = t.context.factory('https://github.com/elementary/houston')

  const references = await repo.references()

  t.not(references.indexOf('refs/remotes/origin/master'), -1)
  t.not(references.indexOf('refs/remotes/origin/v2'), -1)
})

test.serial.failing('can post assets to reference', async (t) => {
  const { done } = await record('lib/service/github/asset.json')
  const repo = t.context.factory('https://github.com/btkostner/vocal')
  const pkg = {
    architecture: 'amd64',
    description: 'Vocal 3.2.6 Loki (amd64)',
    distribution: 'xenial',
    name: 'package.deb',
    path: path.resolve(__dirname, '../../../fixture/lib/service/github/vocal.deb'),
    type: 'deb'
  } as type.IPackage

  const newPkg = await repo.uploadPackage(pkg, 'review', '3.2.6')

  t.is(newPkg.githubId, 6174740)

  await done()
})

test.serial('can post an log', async (t) => {
  const { done } = await record('lib/service/github/log.json')
  const repo = t.context.factory('https://github.com/btkostner/vocal')
  const log = {
    body: 'testy test test',
    level: Log.Level.ERROR,
    title: 'test'
  } as type.ILog

  const newLog = await repo.uploadLog(log, 'review', '3.2.6')

  t.is(newLog.githubId, 326839748)

  await done()
})

test.serial('generates authentication with installation number', async (t) => {
  const { done } = await record('lib/service/github/installation.json')
  const repo = t.context.factory('https://installation:341025@github.com/btkostner/vocal')
  const auth = await repo.getAuthorization()

  t.is(auth, 'token v1.2474f2e312406721d0f20ef317948573101e6144')

  await done()
})
