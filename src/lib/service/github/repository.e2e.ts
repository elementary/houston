/**
 * houston/src/lib/service/github/repository.spec.ts
 * Tests the GitHub repository class.
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Repository } from './repository'

import { tmp } from '../../../../test/utility/fs'

let testingDir: string

beforeAll(async () => {
  testingDir = await tmp('lib/service/github')

  // Redirect tmp folder for testing because testing
  Repository.tmpFolder = testingDir
})

afterAll(async() => {
  await fs.remove(testingDir)
})

test('can clone a repository', async () => {
  const repo = new Repository('https://github.com/elementary/houston')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder)

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()
}, 600000) // 10 minutes because of git clone

test('can clone a repository with tag', async () => {
  const repo = new Repository('https://github.com/elementary/houston')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/tags/0.2.0')

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()

  // tslint:disable-next-line non-literal-require
  const pkg = require(path.resolve(folder, 'package.json'))
  expect(pkg).toHaveProperty('version')
  expect(pkg.version).toEqual('0.1.8')
}, 600000) // 10 minutes because of git clone

test.skip('can clone a repository with a non-annotated tag (#511)', async () => {
  const repo = new Repository('https://github.com/fluks-eos/gdice')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/tags/v1.0.1')

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()
}, 600000) // 10 minutes because of git clone

test('can list all references for a repository', async () => {
  const repo = new Repository('https://github.com/elementary/houston')

  const references = await repo.references()

  expect(references).toContain('refs/heads/master')
  expect(references).toContain('refs/remotes/origin/v2') // TODO: Future me: remove this
}, 600000) // 10 minutes because of git clone for references
