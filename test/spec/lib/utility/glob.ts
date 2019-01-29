/**
 * houston/src/lib/utility/glob.spec.ts
 * Tests glob functions
 */

import * as path from 'path'

import test from 'ava'

import { glob } from '../../../../src/lib/utility/glob'

test('it returns a promise from globbing', async (t) => {
  const files = await glob(path.resolve(__dirname, '**'))

  t.not(files.indexOf(__filename), -1)
})
