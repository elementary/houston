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
import { codeRepositoryFactory, ICodeRepositoryFactory } from '../../../src/lib/service'
import { Build } from '../../../src/worker/preset/build'
import * as type from '../../../src/worker/type'

import { create } from '../../utility/app'
import { tmp } from '../../utility/fs'

interface IContext {
  app: App,
  config: Config,
  directory: string
  factory: ICodeRepositoryFactory
}

const test = baseTest as TestInterface<IContext>

test.beforeEach(async (t) => {
  t.context.app = await create()
  t.context.config = t.context.app.get<Config>(Config)
  t.context.directory = await tmp('worker')
  t.context.factory = t.context.app.get<ICodeRepositoryFactory>(codeRepositoryFactory)
})

test('cassidyjames/palette passes build process', async (t) => {
  const repo = await t.context.factory('https://github.com/cassidyjames/palette')
  const context : type.IContext = {
    appcenter: {},
    appstream: '',
    architecture: '',
    changelog: [],
    distribution: '',
    logs: [],
    nameDeveloper: 'Palette',
    nameDomain: 'com.github.cassidyjames.palette',
    nameHuman: 'Palette',
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
  t.is(proc.result.packages.length, 1)
  t.is(proc.result.packages[0].name, 'com.github.cassidyjames.palette_2.2.0_amd64.deb')
})
