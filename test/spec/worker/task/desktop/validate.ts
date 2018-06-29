/**
 * houston/src/worker/task/desktop/validate.spec.ts
 * Tests the desktop-file-validate docker test
 */

import { test } from 'ava'

import { DesktopValidate } from '../../../../../src/worker/task/desktop/validate'

import { mock } from '../../../../utility/worker'

test('validates files besides default desktop file', async (t) => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/desktop/blank.desktop', 'package/usr/share/applications/blank.desktop')

  worker.tasks.push(DesktopValidate)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  t.is(worker.context.logs.length, 1)
  t.regex(worker.context.logs[0].toString(), /errors/)
  t.regex(worker.context.logs[0].toString(), /blank\.desktop/)
})

test('validate concats logs to single issue', async (t) => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/desktop/blank.desktop', 'package/usr/share/applications/blank.desktop')
  await worker.mock('task/desktop/blank.desktop', 'package/usr/share/applications/another-blank.desktop')
  await worker.mock('task/desktop/spice-up.desktop', 'package/usr/share/applications/com.github.philip-scott.spice-up.desktop')

  worker.tasks.push(DesktopValidate)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  t.is(worker.context.logs.length, 1)
  t.regex(worker.context.logs[0].toString(), /blank\.desktop/)
  t.regex(worker.context.logs[0].toString(), /another-blank\.desktop/)
})
