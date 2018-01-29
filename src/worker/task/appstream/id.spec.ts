/**
 * houston/src/worker/task/appstream/id.spec.ts
 * Tests the appstream id test
 */

import { AppstreamId } from './id'

import { mock, TestWorker } from '../../../../test/utility/worker'

test('passes with a matching ID', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.desktop.xml')

  await worker.setup()
  await worker.run(AppstreamId)
  await worker.teardown()

  expect(worker.storage.logs).toHaveLength(0)
})

test('fails with an incorrect ID', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.elementary.houston.desktop'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.elementary.houston.desktop.xml')

  await worker.setup()
  await worker.run(AppstreamId)
  await worker.teardown()

  expect(worker.storage.logs).toHaveLength(1)
})
