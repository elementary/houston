/**
 * houston/test/e2e/worker/worker.ts
 * Runs some repositories through tests for end to end testing
 */

import { test as baseTest, TestInterface } from 'ava'
import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { App } from '../../../src/lib/app'
import { Config } from '../../../src/lib/config'
import { GitHub } from '../../../src/lib/service/github'
import { Build } from '../../../src/worker/preset/build'
import * as type from '../../../src/worker/type'

import { create } from '../../utility/app'
import { tmp } from '../../utility/fs'

interface IContext {
  app: App,
  config: Config,
  directory: string
}

const test = baseTest as TestInterface<IContext>

test.beforeEach(async (t) => {
  t.context.app = await create()
  t.context.config = t.context.app.get<Config>(Config)
  t.context.directory = await tmp('worker')
})

test.failing('needle-and-thread/vocal passes build process', async (t) => {
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

  const proc = Build(t.context.app, repo, context)
  proc.workspace = path.resolve(t.context.directory, uuid())

  proc.on('run:error', (e) => t.log(e))

  await proc.setup()
  await proc.run()
  await proc.teardown()

  t.true(proc.passes)
})

test.failing('Philip-Scott/Spice-up passes build process', async (t) => {
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

  const proc = Build(t.context.app, repo, context)
  proc.workspace = path.resolve(t.context.directory, uuid())

  proc.on('run:error', (e) => t.log(e))

  await proc.setup()
  await proc.run()
  await proc.teardown()

  t.true(proc.passes)
})

test.failing('elementary/code passes build process', async (t) => {
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

  const proc = Build(t.context.app, repo, context)
  proc.workspace = path.resolve(t.context.directory, uuid())

  proc.on('run:error', (e) => t.log(e))

  await proc.setup()
  await proc.run()
  await proc.teardown()

  t.true(proc.passes)
})
