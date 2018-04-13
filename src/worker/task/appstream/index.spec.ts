/**
 * houston/src/worker/task/appstream/index.spec.ts
 * Tests that known good appstream files pass appstream testing
 */

import { Appstream } from './index'

import { mock } from '../../../../test/utility/worker'

test('failures stop the build', async () => {
  const worker = await mock()

  worker.tasks.push(Appstream)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  expect(worker.fails).toBeTruthy()
}, 300000) // A 5 minute timeout

test('com.github.philip-scott.spice-up passes appstream tests', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/spice-up.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(Appstream)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  expect(worker.passes).toBeTruthy()
}, 300000) // A 5 minute timeout

test('basic errors get concated to single log', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.philip-scott.spice-up.desktop',
    nameDomain: 'com.github.philip-scott.spice-up'
  })

  await worker.mock('task/appstream/blank.xml', 'package/usr/share/metainfo/com.github.philip-scott.spice-up.appdata.xml')

  worker.tasks.push(Appstream)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  expect(worker.fails).toBeTruthy()

  // God this kinda sucks, but it does what it needs to.
  const concatLog = worker.context.logs
    .find((l) => (l.title.indexOf('tests') !== -1))

  expect(concatLog.body).toBeDefined()
}, 300000) // A 5 minute timeout
