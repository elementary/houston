/**
 * houston/src/lib/service/gitlab.e2e.ts
 * Tests the GitLab class.
 */

import * as fs from 'fs-extra'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import * as Log from '../log'
import { GitLab } from './gitlab'
import * as type from './type'

import { tmp } from '../../../test/utility/fs'
import { record } from '../../../test/utility/http'

let testingDir: string

beforeAll(async () => {
  // I'm so sorry to whom is reading this next. My best guess is a race
  // Condition in fs-extra, uuid, or jest. This whole file will just hang
  // Forever without it. I'm so sorry.
  await new Promise((resolve, reject) => {
    setTimeout(async () => {
      testingDir = await tmp('lib/service/gitlab')

      // Redirect tmp folder for testing because testing
      GitLab.tmpFolder = testingDir

      return resolve()
    }, 100)
  })
})

afterAll(async() => {
  await fs.remove(testingDir)
})

test('can clone a repository', async () => {
  const repo = new GitLab('https://gitlab.com/RupertDev/houstontesting')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder)

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()
}, 600000) // 10 minutes because of git clone

test('can clone a repository with tag', async () => {
  const repo = new GitLab('https://gitlab.com/RupertDev/houstontesting')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/tags/v0.1.0')

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()

  // tslint:disable-next-line non-literal-require
  const pkg = require(path.resolve(folder, 'package.json'))
  expect(pkg).toHaveProperty('version')
  expect(pkg.version).toEqual('0.0.0-development')
}, 600000) // 10 minutes because of git clone

test.skip('can clone a repository with a non-annotated tag (#511)', async () => {
  const repo = new GitLab('https://gitlab.com/RupertDev/houstontesting')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/tags/1.0.0')

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()
}, 600000) // 10 minutes because of git clone

test('can list all references for a repository', async () => {
  const repo = new GitLab('https://gitlab.com/RupertDev/houstontesting')

  const references = await repo.references()

  expect(references).toContain('refs/heads/master')
}, 600000) // 10 minutes because of git clone for references

test('can post an log', async () => {
  const { done } = await record('lib/service/gitlab/log.json')
  const repo = new GitLab('https://gitlab.com/RupertDev/houstontesting')
  const log = {
    body: 'testy test test',
    level: Log.Level.ERROR,
    title: 'test'
  } as type.ILog

  const newLog = await repo.uploadLog(log, 'review', '3.2.6')

  expect(newLog.gitlabId).toBe(11882433)

  await done()
})
