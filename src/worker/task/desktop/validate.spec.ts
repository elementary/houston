/**
 * houston/src/worker/task/desktop/validate.spec.ts
 * Tests the desktop-file-validate docker test
 */

import * as fs from 'fs-extra'

import { DesktopValidate } from './validate'

import { mock } from '../../../../test/utility/worker'

test('validates files besides default desktop file', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/desktop/blank.desktop', 'package/usr/share/applications/blank.desktop')

  await worker.setup()
  await worker.run(DesktopValidate)
  await worker.teardown()

  expect(worker.storage.logs).toHaveLength(1)
})

test('validate concats logs to single issue', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/desktop/blank.desktop', 'package/usr/share/applications/blank.desktop')
  await worker.mock('task/desktop/spice-up.desktop', 'package/usr/share/applications/com.github.philip-scott.spice-up.desktop')

  await worker.setup()
  await worker.run(DesktopValidate)
  await worker.teardown()

  expect(worker.storage.logs).toHaveLength(1)
})
