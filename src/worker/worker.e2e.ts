/**
 * houston/src/worker/worker.e2e.ts
 * Runs some repositories through tests for end to end testing
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { App } from '../lib/app'
import { GitHub } from '../lib/service'
import { Build } from './preset/build'
import * as type from './type'

import { create } from '../../test/utility/app'
import { tmp } from '../../test/utility/fs'

// NOTE: All tests have an hour long timeout because we are building thing
jest.setTimeout(3600000)

let app: App
let testingDir: string

// Change the default workspace location for testing
beforeAll(async () => {
  app = await create()

  testingDir = await tmp('worker')
})

test.skip('needle-and-thread/vocal passes build process', async () => {
  const repo = new GitHub('https://github.com/needle-and-thread/vocal')

  const context : type.IContext = {
    appcenter: {},
    appstream: '',
    architecture: 'amd64',
    changelog: [],
    distribution: 'juno',
    logs: [],
    nameAppstream: 'com.github.needle-and-thread.vocal.desktop',
    nameDeveloper: 'Needle & Thread',
    nameDomain: 'com.github.needle-and-thread.vocal',
    nameHuman: 'Vocal',
    references: ['refs/tags/2.2.0'],
    type: 'app',
    version: '2.2.0'
  }

  const proc = Build(app, repo, context)
  proc.workspace = path.resolve(testingDir, uuid())

  proc.on('run:error', (e) => console.error(e))

  await proc.setup()
  await proc.run()
  await proc.teardown()

  expect(proc.passes).toBeTruthy()
})

// TODO: Enable when AppStream OARS added
test.skip('Philip-Scott/Spice-up passes build process', async () => {
  const repo = new GitHub('https://github.com/Philip-Scott/Spice-up')

  const context : type.IContext = {
    appcenter: {},
    appstream: '',
    architecture: 'amd64',
    changelog: [],
    distribution: 'loki',
    logs: [],
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDeveloper: 'Philip Scott',
    nameDomain: 'com.github.philip-scott.spice-up',
    nameHuman: 'Spice-Up',
    references: ['refs/tags/1.3.2'],
    type: 'app',
    version: '1.3.2'
  }

  const proc = Build(app, repo, context)
  proc.workspace = path.resolve(testingDir, uuid())

  proc.on('run:error', (e) => console.error(e))

  await proc.setup()
  await proc.run()
  await proc.teardown()

  expect(proc.passes).toBeTruthy()
})

// TODO: Fix bugs
test.skip('elementary/code passes build process', async () => {
  const repo = new GitHub('https://github.com/elementary/code')

  const context : type.IContext = {
    appcenter: {},
    appstream: '',
    architecture: 'amd64',
    changelog: [],
    distribution: 'juno',
    logs: [],
    nameAppstream: 'io.elementary.code.desktop',
    nameDeveloper: 'elementary',
    nameDomain: 'io.elementary.code',
    nameHuman: 'Code',
    references: [],
    type: 'app',
    version: '2.4.1'
  }

  const proc = Build(app, repo, context)
  proc.workspace = path.resolve(testingDir, uuid())

  proc.on('run:error', (e) => console.error(e))

  await proc.setup()
  await proc.run()
  await proc.teardown()

  expect(proc.passes).toBeTruthy()
}, 3600000)

// TODO: Remove after we are all in v2
test.skip('needle-and-thread/vocal passes old flightcheck process', async () => {
  const repo = new GitHub('https://github.com/needle-and-thread/vocal')

  const context : type.IContext = {
    appcenter: {},
    appstream: '',
    changelog: [],
    logs: [],
    nameAppstream: 'com.github.needle-and-thread.vocal.desktop',
    nameDeveloper: 'needle-and-thread',
    nameDomain: 'com.github.needle-and-thread.vocal',
    nameHuman: 'vocal',
    package: { type: 'deb' },
    references: ['refs/tags/2.2.0'],
    type: 'app',
    version: '2.2.0'
  }

  const proc = Build(app, repo, context)
  proc.workspace = path.resolve(testingDir, uuid())

  proc.on('run:error', (e) => console.error(e))

  await proc.setup()
  await proc.run()
  await proc.teardown()

  expect(proc.passes).toBeTruthy()
})
