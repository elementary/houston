/**
 * houston/test/spec/worker/preset/release.ts
 * Tests that the release preset has all the tasks we need
 */

import { test as baseTest, TestInterface } from 'ava'
import * as path from 'path'

import { App } from '../../../../src/lib/app'
import { Release } from '../../../../src/worker/preset/release'
import { Upload } from '../../../../src/worker/task/upload'
import { IContext } from '../../../../src/worker/type'

import { create as createApp } from '../../../utility/app'
import { context as createContext } from '../../../utility/worker'
import { Repository } from '../../../utility/worker/repository'

const test = baseTest as TestInterface<{
  app: App,
  repo: Repository,
  context: IContext
}>

test.beforeEach(async (t) => {
  t.context.app = await createApp()
  t.context.repo = new Repository('https://github.com/elementary/houston')
  t.context.context = await createContext()
})

test('includes regular tasks from Build preset', async (t) => {
  const worker = Release(t.context.app, t.context.repo, t.context.context)

  t.not(worker.tasks.length, 0)
})

test('includes upload post task', async (t) => {
  const worker = Release(t.context.app, t.context.repo, t.context.context)

  t.not(worker.postTasks.indexOf(Upload), -1)
})
