/**
 * houston/src/lib/service/github/repository.spec.ts
 * Tests the GitHub repository class.
 */

import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import * as fsHelper from '../../helper/fs'
import { Repository } from './repository'

const testingDir = path.resolve(os.tmpdir(), 'houston-test', 'process', uuid())

// Extend the default timeout time due to long running tests
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

afterAll(async() => {
  await fsHelper.rmr(testingDir)
})

test('can clone a repository', async () => {
  const repo = new Repository('elementary', 'houston')

  const folder = path.resolve(testingDir, uuid())
  await fsHelper.mkdirp(folder)

  await repo.clone(folder)

  const exists = await fsHelper.folderExists(folder)
  expect(exists).toBeTruthy()

  await fsHelper.rmp(folder)
})

test('can clone a repository with tag', async () => {
  const repo = new Repository('elementary', 'houston')

  const folder = path.resolve(testingDir, uuid())
  await fsHelper.mkdirp(folder)

  await repo.clone(folder, 'refs/tags/0.2.0')

  const exists = await fsHelper.folderExists(folder)
  expect(exists).toBeTruthy()

  // tslint:disable-next-line non-literal-require
  const pkg = require(path.resolve(folder, 'package.json'))
  expect(pkg).toHaveProperty('version')
  expect(pkg.version).toEqual('0.1.8')

  await fsHelper.rmp(folder)
})
