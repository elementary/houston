/**
 * houston/test/spec/worker/task/appstream/id.ts
 * Tests the appstream id test
 */

import { test } from 'ava'

import { AppstreamId } from '../../../../../src/worker/task/appstream/id'

import { mock } from '../../../../utility/worker'

test('passes with a matching ID', async (t) => {
  const worker = await mock({
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.philip_scott.spice_up.appdata.xml')

  worker.tasks.push(AppstreamId)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  worker.context.logs.forEach((l) => t.log(l))

  t.true(worker.passes)
})

test('fails with an incorrect ID', async (t) => {
  const worker = await mock({
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.elementary.houston.appdata.xml')

  worker.tasks.push(AppstreamId)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  worker.context.logs.forEach((l) => t.log(l))

  t.true(worker.fails)
})
