/**
 * houston/test/e2e/worker/task/debian/changelog.ts
 * Tests that the changelog task works as needed
 */

import { test } from 'ava'

import { DebianChangelog } from '../../../../../src/worker/task/debian/changelog'

import { mock } from '../../../../utility/worker'

test('changelog renders correctly', async (t) => {
  const worker = await mock({
    changelog: [{
      author: 'Blake Kostner',
      changes: 'updated some fun things',
      date: new Date(),
      version: '0.0.1'
    }, {
      author: 'Blake Kostner',
      changes: 'resion release',
      date: new Date(),
      version: '1.0.0'
    }],
    nameAppstream: 'com.github.elementary.houston.desktop',
    nameDomain: 'com.github.elementary.houston'
  })

  worker.tasks.push(DebianChangelog)

  await worker.setup()
  await worker.run()

  const changelog = await worker.readFile('dirty/debian/changelog')

  await worker.teardown()

  t.not(changelog.indexOf('resion release'), -1)
  t.not(changelog.indexOf('updated some fun things'), -1)
})
