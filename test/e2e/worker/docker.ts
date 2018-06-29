/**
 * houston/test/e2e/worker/docker.ts
 * Tests docker usage ability
 */

import { test as baseTest, TestInterface } from 'ava'
import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Config } from '../../../src/lib/config'
import { Docker } from '../../../src/worker/docker'

import { setup as setupConfig } from '../../utility/config'
import * as dockerUtility from '../../utility/docker'

interface IContext {
  config: Config,
  images: string[]
}

const test = baseTest as TestInterface<IContext>

test.beforeEach(async (t) => {
  t.context.config = await setupConfig()
  t.context.images = []
})

test.afterEach(async (t) => {
  await Promise.all(t.context.images.map((image) => {
    return dockerUtility.removeImages(t.context.config, image)
  }))
})

test('can check if image exists', async (t) => {
  t.context.images = [`houston-${uuid()}`]
  const docker = new Docker(t.context.config, t.context.images[0])

  t.false(await docker.exists())
})

test('can create a docker image', async (t) => {
  t.context.images = [`houston-${uuid()}`]
  const docker = new Docker(t.context.config, t.context.images[0])

  const imageDirectory = path.resolve(__dirname, '../../fixture/worker/docker/image1')
  await docker.create(imageDirectory)

  t.true(await docker.exists())
})
