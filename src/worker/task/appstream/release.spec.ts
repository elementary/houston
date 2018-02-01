/**
 * houston/src/worker/task/appstream/release.spec.ts
 * Tests we can insert markdown changelogs to the appstream file
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'

import { AppstreamRelease } from './release'

import { mock } from '../../../../test/utility/worker'

/**
 * Asserts that the changelog is what we expect
 *
 * @param {string} data
 * @param {string} expected
 *
 * @throws {Error}
 * @return {void}
 */
function expectChangelog (data, expected) {
  const parseOptions = {
    decodeEntities: true,
    normalizeWhitespace: true,
    xmlMode: true
  }

  const $d = cheerio.load(data, parseOptions)
  const $e = cheerio.load(expected, parseOptions)

  const $release = $d('component > releases > release:first-of-type')

  expect($release.attr('version')).toBe($e('release').attr('version'))
  expect($release.attr('urgency')).toBe($e('release').attr('urgency'))

  // Whitespace is a pain. Remove all of it and hope the tests don't fail
  const dRelease = $release.html().replace(/\s/img, '')
  const eRelease = $e('release').html().replace(/\s/img, '')

  expect(dRelease).toBe(eRelease)
}

test('can insert a basic list of changes', async () => {
  const worker = await mock({
    changelog: [{
      author: 'Blake Kostner',
      changes: `This is a change I made
This is another change I made`,
      date: new Date(),
      version: '1.0.0'
    }],
    nameAppstream: 'com.github.elementary.houston.desktop'
  })

  const p = 'package/usr/share/metainfo/com.github.elementary.houston.desktop.xml'

  await worker.mock('task/appstream/blank.xml', p)

  await worker.setup()
  await worker.run(AppstreamRelease)

  const file = await fs.readFile(worker.get(p), 'utf8')

  expect(worker.passes()).toBeTruthy()
  expectChangelog(file, `
    <release version="1.0.0" urgency="medium">
      <description>
        <ul>
          <li>This is a change I made</li>
          <li>This is another change I made</li>
        </ul>
      </description>
    </release>
  `)

  await worker.teardown()
})

test('it strips out bad html tags from changes', async () => {
  const worker = await mock({
    changelog: [{
      author: 'Blake Kostner',
      changes: `# All about my changes

This is a bunch of cool things that are updated.

* More fun stuff
* Even cooler stuff

<script>evil shenanigans</script>

    A sample code block`,
      date: new Date(),
      version: '1.0.0'
    }],
    nameAppstream: 'com.github.elementary.houston.desktop'
  })

  const p = 'package/usr/share/metainfo/com.github.elementary.houston.desktop.xml'

  await worker.mock('task/appstream/blank.xml', p)

  await worker.setup()
  await worker.run(AppstreamRelease)

  const file = await fs.readFile(worker.get(p), 'utf8')

  expect(worker.passes()).toBeTruthy()
  expectChangelog(file, `
    <release version="1.0.0" urgency="medium">
      <description>
        All about my changes
        <p>This is a bunch of cool things that are updated.</p>
        <ul>
          <li>More fun stuff</li>
          <li>Even cooler stuff</li>
        </ul>
        <p>&lt;script&gt;evil shenanigans&lt;/script&gt;</p>
        A sample code block
      </description>
    </release>
  `)

  await worker.teardown()
})
