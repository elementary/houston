/**
 * houston/src/worker/task/appstream/validate.spec.ts
 * Tests the validatecli docker test
 */

import * as fs from 'fs-extra'

import { AppstreamValidate } from './validate'

import { mock } from '../../../../test/utility/worker'

test('passes with a valid appstream file', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(AppstreamValidate)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  expect(worker.context.logs).toHaveLength(0)
}, 300000) // A 5 minute timeout

test('fails with a blank appstream file', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/blank.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(AppstreamValidate)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  expect(worker.context.logs).toHaveLength(1)
}, 300000) // A 5 minute timeout
