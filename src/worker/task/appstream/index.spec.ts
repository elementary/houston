/**
 * houston/src/worker/task/appstream/index.spec.ts
 * Tests that known good appstream files pass appstream testing
 */

import { Appstream } from './index'

import { mock, TestWorker } from '../../../../test/utility/worker'

test('failures stop the build', async () => {
  const worker = await mock()

  await worker.setup()
  await worker.run(Appstream)
  await worker.teardown()

  expect(worker.fails()).toBeTruthy()
})

test('com.github.philip-scott.spice-up passes appstream tests', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.desktop.xml')

  await worker.setup()
  await worker.run(Appstream)
  await worker.teardown()

  expect(worker.passes()).toBeTruthy()
})
