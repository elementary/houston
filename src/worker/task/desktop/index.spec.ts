/**
 * houston/src/worker/task/desktop/index.spec.ts
 * Tests that known good appstream files pass appstream testing
 */

import { Desktop } from './index'

import { mock } from '../../../../test/utility/worker'

test('failures stop the build', async () => {
  const worker = await mock()

  await worker.setup()
  await worker.run(Desktop)
  await worker.teardown()

  expect(worker.fails()).toBeTruthy()
})

test('com.github.philip-scott.spice-up passes desktop tests', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/desktop/spice-up.desktop', 'package/usr/share/applications/com.github.philip-scott.spice-up.desktop')

  await worker.setup()
  await worker.run(Desktop)
  await worker.teardown()

  expect(worker.passes()).toBeTruthy()
})
