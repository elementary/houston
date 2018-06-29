/**
 * houston/test/spec/worker/task/appstream/content-rating.ts
 * Tests the tests about OARS
 */

import { test } from 'ava'

import { AppstreamContentRating } from '../../../../../src/worker/task/appstream/content-rating'

import { mock } from '../../../../utility/worker'

test('missing content_rating causes an error', async (t) => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/blank.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(AppstreamContentRating)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  worker.context.logs.forEach((l) => t.log(l))

  t.true(worker.fails)
  t.regex(worker.context.logs[0].title.toLowerCase(), /missing/)
})

test('missing a content_rating attribute causes an error', async (t) => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/content-rating.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(AppstreamContentRating)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  worker.context.logs.forEach((l) => t.log(l))

  t.true(worker.fails)
  t.regex(worker.context.logs[0].body.toLowerCase(), /sex-adultery/)
  t.regex(worker.context.logs[0].body.toLowerCase(), /sex-appearance/)
  t.regex(worker.context.logs[0].body.toLowerCase(), /social-chat/)
  t.regex(worker.context.logs[0].body.toLowerCase(), /social-audio/)
})
