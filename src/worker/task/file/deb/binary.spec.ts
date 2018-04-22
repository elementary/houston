/**
 * houston/src/worker/task/file/deb/binary.spec.ts
 * Tests the deb file binary test
 */

import { FileDebBinary } from './binary'

import { mock } from '../../../../../test/utility/worker'

test('matches a correctly named bin file', async () => {
  const worker = await mock({
    nameDomain: 'com.github.elementary.houston'
  })

  await worker.mock('task/empty', 'package/usr/bin/com.github.elementary.houston')

  worker.tasks.push(FileDebBinary)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  expect(worker.passes).toBeTruthy()
})

test('includes project files in error log', async () => {
  const worker = await mock({
    nameDomain: 'com.github.elementary.houston'
  })

  await worker.mock('task/empty', 'package/usr/share/docs/com.github.elementary.desktop')
  await worker.mock('task/empty', 'package/usr/n00p/test')

  worker.tasks.push(FileDebBinary)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  expect(worker.fails).toBeTruthy()

  const log = worker.context.logs[0]

  expect(log.body).toMatch(/usr\/share\/docs\/com\.github\.elementary\.desktop/)
})
