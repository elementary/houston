/**
 * houston/test/utililty/worker.ts
 * Helpful functions to test the worker process
 */

import { Config } from '../../../src/lib/config'
import { Repository } from '../../../src/lib/service/mock/repository'

import { create } from '../app'
import { context } from './context'
import { TestWorker } from './worker'

export async function mock (values = {}): Promise<TestWorker> {
  const app = await create()

  const config = app.get<Config>(Config)
  const store = context(values)
  const repo = new Repository('testrepo')

  return new TestWorker(config, repo, store)
}
