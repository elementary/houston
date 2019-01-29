/**
 * houston/test/spec/worker/task/file/deb/binary.ts
 * Tests the deb file binary test
 */

import test from 'ava'

import { FileDebBinary } from '../../../../../../src/worker/task/file/deb/binary'

import { mock } from '../../../../../utility/worker'

test('matches a correctly named bin file', async (t) => {
  const worker = await mock({
    nameDomain: 'com.github.elementary.houston'
  })

  await worker.mock('task/empty', 'package/usr/bin/com.github.elementary.houston')

  worker.tasks.push(FileDebBinary)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  t.true(worker.passes)
})

test('includes project files in error log', async (t) => {
  const worker = await mock({
    nameDomain: 'com.github.elementary.houston'
  })

  await worker.mock('task/empty', 'package/usr/share/docs/com.github.elementary.desktop')
  await worker.mock('task/empty', 'package/usr/n00p/test')

  worker.tasks.push(FileDebBinary)

  await worker.setup()
  await worker.run()
  await worker.teardown()

  t.true(worker.fails)
  t.regex(worker.context.logs[0].body, /usr\/share\/docs\/com\.github\.elementary\.desktop/)
})
