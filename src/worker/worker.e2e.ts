/**
 * houston/src/worker/worker.e2e.ts
 * Runs some repositories through tests for end to end testing
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Config } from '../lib/config'
import { Repository as GithubRepository } from '../lib/service/github/repository'
import { Build } from './preset/build'
import * as type from './type'
import { Worker } from './worker'

import { create } from '../../test/utility/app'
import { tmp } from '../../test/utility/fs'

let config: Config
let testingDir: string

// Change the default workspace location for testing
beforeAll(async () => {
  const app = await create()
  config = app.get<Config>(Config)

  testingDir = await tmp('worker')
})

// TODO: Enable when AppStream OARS added
test.skip('needle-and-thread/vocal passes build process', async () => {
  const repo = new GithubRepository('https://github.com/needle-and-thread/vocal')

  const context : type.IContext = {
    appcenter: {},
    appstream: '',
    architecture: 'amd64',
    changelog: [],
    distribution: 'xenial',
    logs: [],
    nameAppstream: 'com.github.needle-and-thread.vocal.desktop',
    nameDeveloper: 'Needle & Thread',
    nameDomain: 'com.github.needle-and-thread.vocal',
    nameHuman: 'Vocal',
    packageSystem: null,
    references: ['refs/tags/2.1.5'],
    type: 'app',
    version: '2.1.5'
  }

  const proc = new Worker(config, repo, context)
  proc.workspace = path.resolve(testingDir, uuid())

  proc.on('run:error', (e) => console.error(e))

  await proc.setup()
  await proc.run(Build)
  await proc.teardown()

  expect(proc.passes).toBeTruthy()
}, 3600000) // An hour long timeout because we are building things

// TODO: Enable when AppStream OARS added
test.skip('Philip-Scott/Spice-up passes build process', async () => {
  const repo = new GithubRepository('https://github.com/Philip-Scott/Spice-up')

  const context : type.IContext = {
    appcenter: {},
    appstream: '',
    architecture: 'amd64',
    changelog: [],
    distribution: 'xenial',
    logs: [],
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDeveloper: 'Philip Scott',
    nameDomain: 'com.github.philip-scott.spice-up',
    nameHuman: 'Spice-Up',
    packageSystem: null,
    references: ['refs/tags/0.6.0'],
    type: 'app',
    version: '0.6.0'
  }

  const proc = new Worker(config, repo, context)
  proc.workspace = path.resolve(testingDir, uuid())

  proc.on('run:error', (e) => console.error(e))

  await proc.setup()
  await proc.run(Build)
  await proc.teardown()

  expect(proc.passes).toBeTruthy()
}, 3600000) // An hour long timeout because we are building things

// TODO: Fix bugs
test.skip('elementary/code passes build process', async () => {
  const repo = new GithubRepository('https://github.com/elementary/code')

  const context : type.IContext = {
    appcenter: {},
    appstream: '',
    architecture: 'amd64',
    changelog: [],
    distribution: 'xenial',
    logs: [],
    nameAppstream: 'io.elementary.code.desktop',
    nameDeveloper: 'elementary',
    nameDomain: 'io.elementary.code',
    nameHuman: 'Code',
    packageSystem: null,
    references: [],
    type: 'app',
    version: '2.4.1'
  }

  const proc = new Worker(config, repo, context)
  proc.workspace = path.resolve(testingDir, uuid())

  proc.on('run:error', (e) => console.error(e))

  await proc.setup()
  await proc.run(Build)
  await proc.teardown()

  expect(proc.passes).toBeTruthy()
}, 3600000) // An hour long timeout because we are building things
