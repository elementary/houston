/**
 * houston/src/worker/docker.e2e.ts
 * Tests docker usage ability
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Docker } from './docker'

import { setup as setupConfig } from '../../test/utility/config'
import * as dockerUtility from '../../test/utility/docker'

let config = null

// TODO: Figure out a better way of testing with Docker
beforeEach(async () => {
  config = await setupConfig()

  await dockerUtility.teardown(config)
})

afterAll(async () => {
  await dockerUtility.teardown(config)
})

test('can check if image exists', async () => {
  const docker = new Docker(config, `houston-${uuid()}`)
  const existance = await docker.exists()

  expect(existance).toBeFalsy()
})

test('can create a docker image', async () => {
  const docker = new Docker(config, `houston-image1-${uuid()}`)

  const imageDirectory = path.resolve(__dirname, '..', '..', 'test', 'worker', 'docker', 'image1')
  await docker.create(imageDirectory)

  const existance = await docker.exists()

  expect(existance).toBeTruthy()
}, 600000) // 10 minutes because docker checks
