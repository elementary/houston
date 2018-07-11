/**
 * houston/test/spec/worker/task/appstream/screenshot.ts
 * Tests the appstream screenshot test
 */

import { test } from 'ava'

import { AppstreamScreenshot } from '../../../../../src/worker/task/appstream/screenshot'

import { mock } from '../../../../utility/worker'

test('passes with screenshots specified', async (t) => {
  const worker = await mock({
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.philip_scott.spice_up.appdata.xml')

  worker.tasks.push(AppstreamScreenshot)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  worker.context.logs.forEach((l) => t.log(l))

  t.true(worker.passes)
})
