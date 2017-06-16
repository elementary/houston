/**
 * houston/src/process/process.e2e.ts
 * Runs some repositories through tests for end to end testing
 */

import { Repository as GithubRepository } from '../lib/service/github/repository'
import { Process } from './process'

import { setup as setupConfig } from '../../test/utility/config'

let config = null

// Extend the default timeout time due to long running tests
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

beforeEach(async () => {
  config = await setupConfig()
})

test.only('needleandthread/vocal passes release process', async () => {
  const repo = new GithubRepository('needleandthread', 'vocal', 'master')
  const proc = new Process(config, repo)

  await proc.setup()
  await proc.teardown()
})
