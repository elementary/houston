/**
 * houston/test/utililty/worker.ts
 * Helpful functions to test the worker process
 */

import { create } from '../app'
import { context } from './context'
import { Repository } from './repository'
import { TestWorker } from './worker'

export async function mock (values = {}): Promise<TestWorker> {
  const app = await create()
  const store = context(values)
  const repo = new Repository('testrepo')

  return new TestWorker(app, repo, store)
}
