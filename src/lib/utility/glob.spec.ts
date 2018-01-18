/**
 * houston/src/lib/utility/glob.spec.ts
 * Tests glob functions
 */

import * as path from 'path'

import { glob } from './glob'

test('it returns a promise from globbing', async () => {
  const promise = await glob(path.resolve(__dirname, '**'))

  expect(promise).toContain(path.resolve(__dirname, 'glob.spec.ts'))
})
