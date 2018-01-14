/**
 * houston/src/worker/worker.ts
 * The master class for repository processing.
 *
 * @exports {Class} Process - A processing class
 */

import { Repository } from '../lib/service/github/repository'
import { Worker } from './worker'

import { setup as setupConfig } from '../../test/utility/config'

let config = null

beforeEach(async () => {
  config = await setupConfig()
})

test('can be created with a GitHub repository', async () => {
  const repo = new Repository('https://github.com/elementary/houston')
  const process = new Worker(config, repo)
})
