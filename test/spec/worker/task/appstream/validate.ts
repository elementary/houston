/**
 * houston/src/worker/task/appstream/validate.spec.ts
 * Tests the validatecli docker test
 */

import test from 'ava'
import * as fs from 'fs-extra'

import { AppstreamValidate } from '../../../../../src/worker/task/appstream/validate'

import { mock } from '../../../../utility/worker'

test('passes with a valid appstream file', async (t) => {
  const worker = await mock({
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(AppstreamValidate)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  worker.context.logs.forEach((l) => t.log(l))

  t.true(worker.passes)
})

test('fails with a blank appstream file', async (t) => {
  const worker = await mock({
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/blank.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(AppstreamValidate)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  worker.context.logs.forEach((l) => t.log(l))

  t.true(worker.fails)
})
