/**
 * houston/src/process/process.ts
 * The master class for repository processing.
 *
 * @exports {Class} Process - A processing class
 */

import { Repository } from '../lib/service/github/repository'
import { Process } from './process'

import { setup as setupConfig } from '../../test/utility/config'

let config = null

beforeEach(async () => {
  config = await setupConfig()
})

test('can be created with a GitHub repository', async () => {
  const repo = new Repository('elementary', 'houston')
  const process = new Process(config, repo)
})
