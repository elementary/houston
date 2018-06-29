/**
 * houston/test/spec/worker/task/appstream/index.ts
 * Tests that known good appstream files pass appstream testing
 */

import { test } from 'ava'

import { Appstream } from '../../../../../src/worker/task/appstream/index'

import { mock } from '../../../../utility/worker'

test('failures stop the build', async (t) => {
  const worker = await mock()

  worker.tasks.push(Appstream)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  t.true(worker.fails)
})

test('com.github.philip-scott.spice-up passes appstream tests', async (t) => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(Appstream)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  t.true(worker.passes)
})

test('basic errors get concated to single log', async (t) => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/blank.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(Appstream)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  worker.context.logs.forEach((l) => t.log(l))

  const combinedLog = worker.context.logs
    .find((log) => (log.title.match(/appstream tests/i) != null))

  t.true(worker.fails)

  t.regex(combinedLog.body, /description/)
  t.regex(combinedLog.body, /summary/)
  t.regex(combinedLog.body, /screenshots/)

  t.regex(combinedLog.body, /id/)
  t.regex(combinedLog.body, /name/)
  t.regex(combinedLog.body, /project_license/)
})
