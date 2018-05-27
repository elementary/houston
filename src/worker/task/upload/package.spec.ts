/**
 * houston/src/worker/task/upload/package.spec.ts
 * Tests uploading package assets
 */

import * as sinon from 'sinon'

import { packageRepository } from '../../../lib/service'
import { UploadPackage } from './package'

import { fixture } from '../../../../test/utility/fs'
import { mock } from '../../../../test/utility/worker'

test('uploads package to codeRepository if also packageRepository', async () => {
  const worker = await mock({
    distribution: 'loki',
    nameDomain: 'com.github.elementary.houston',
    package: {
      path: fixture('worker/docker/image1/Dockerfile'),
      type: 'deb'
    },
    references: ['refs/heads/loki']
  })

  const setup = new UploadPackage(worker)

  worker.repository.uploadPackage = sinon.fake.resolves()
  setup.uploadToPackageRepositories = sinon.fake.resolves()

  await setup.run()

  expect(worker.repository.uploadPackage.callCount).not.toBe(0)
}, 300000)

test('concats error logs to something easy to read', async () => {
  expect.assertions(1)

  const worker = await mock({
    distribution: 'loki',
    nameDomain: 'com.github.elementary.houston',
    package: {
      path: fixture('worker/docker/image1/Dockerfile'),
      type: 'deb'
    },
    references: ['refs/heads/loki']
  })

  worker.app.unbind(packageRepository)

  const setup = new UploadPackage(worker)

  try {
    await setup.run()
  } catch (err) {
    expect(err.body).toMatch(/mock Repository/)
  }
})
