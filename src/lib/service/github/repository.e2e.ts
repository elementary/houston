/**
 * houston/src/lib/service/github/repository.spec.ts
 * Tests the GitHub repository class.
 */

import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import * as fsHelper from '../../helper/fs'
import { Repository } from './repository'

// Extend the default timeout time due to long running tests
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

test('can clone a repository', async () => {
  const repo = new Repository('elementary', 'houston')

  const folder = path.resolve(os.tmpdir(), 'houston-test', 'service', 'github', uuid())
  await fsHelper.mkdirp(folder)

  await repo.clone(folder)

  const exists = await fsHelper.folderExists(folder)
  expect(exists).toBeTruthy()

  await fsHelper.rmp(folder)
})
