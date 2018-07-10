/**
 * houston/test/spec/worker/task/desktop/index.ts
 * Tests that known good appstream files pass appstream testing
 */

import { test } from 'ava'

import { DesktopIcon } from '../../../../../src/worker/task/desktop/icon'
import { Desktop } from '../../../../../src/worker/task/desktop/index'

import { mock } from '../../../../utility/worker'

test('failures stop the build', async (t) => {
  const worker = await mock()

  worker.tasks.push(Desktop)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  t.true(worker.fails)
})

test('com.github.philip-scott.spice-up passes desktop tests', async (t) => {
  const worker = await mock({
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/desktop/spice-up.desktop', 'package/usr/share/applications/com.github.philip-scott.spice-up.desktop')

  worker.tasks.push(Desktop)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  t.true(worker.passes)
})

test('system apps do not have icon validation #590', async (t) => {
  const worker = await mock({
    nameDomain: 'io.elementary.appcenter',
    type: 'system-app'
  })

  const desktop = new Desktop(worker)

  t.is(desktop.tasks.indexOf(DesktopIcon), -1)
})
