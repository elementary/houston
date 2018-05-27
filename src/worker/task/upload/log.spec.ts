/**
 * houston/src/worker/task/upload/log.spec.ts
 * Tests uploading logs to third party services
 */

import * as sinon from 'sinon'

import { packageRepository } from '../../../lib/service'
import { UploadLog } from './log'

import { fixture } from '../../../../test/utility/fs'
import { mock } from '../../../../test/utility/worker'

test('uploads logs to codeRepository if also logRepository', async () => {
  const worker = await mock({
    distribution: 'loki',
    logs: [{ title: 'test', body: 'testy test test' }],
    nameDomain: 'com.github.elementary.houston',
    package: { type: 'deb' },
    references: ['refs/heads/loki']
  })

  worker.repository.uploadLog = sinon.fake.resolves()

  const setup = new UploadLog(worker)
  await setup.run()

  expect(worker.repository.uploadLog.callCount).not.toBe(0)
}, 300000)
