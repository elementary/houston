/**
 * houston/src/worker/task/appstream/content-rating.spec.ts
 * Tests the tests about OARS
 */

import { AppstreamContentRating } from './content-rating'

import { mock } from '../../../../test/utility/worker'

test('missing content_rating causes an error', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/blank.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(AppstreamContentRating)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  expect(worker.fails).toBeTruthy()
  expect(worker.context.logs[0].title.toLowerCase()).toContain('missing')
}, 300000) // A 5 minute timeout

test('missing a content_rating attribute causes an error', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/content-rating.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(AppstreamContentRating)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  expect(worker.fails).toBeTruthy()
  expect(worker.context.logs[0].body.toLowerCase()).toContain('sex-adultery')
  expect(worker.context.logs[0].body.toLowerCase()).toContain('sex-appearance')
  expect(worker.context.logs[0].body.toLowerCase()).toContain('social-chat')
  expect(worker.context.logs[0].body.toLowerCase()).toContain('social-audio')
}, 300000) // A 5 minute timeout
