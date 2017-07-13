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
import { timeout } from '../../../../test/utility/jasmine'

let testingDir: string

// Extend the default timeout time due to long running tests
timeout(10)

beforeAll(async () => {
  testingDir = await tmp('lib/service/github')
})

afterAll(async() => {
  await fs.remove(testingDir)
})

test('can clone a repository', async () => {
  const repo = new Repository('elementary', 'houston')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder)

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()
})

test('can clone a repository with tag', async () => {
  const repo = new Repository('elementary', 'houston')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/tags/0.2.0')

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()

  // tslint:disable-next-line non-literal-require
  const pkg = require(path.resolve(folder, 'package.json'))
  expect(pkg).toHaveProperty('version')
  expect(pkg.version).toEqual('0.1.8')
})
