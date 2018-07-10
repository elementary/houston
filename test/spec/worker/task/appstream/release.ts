/**
 * houston/test/spec/worker/task/appstream/release.ts
 * Tests we can insert markdown changelogs to the appstream file
 */

import { test } from 'ava'
import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'

import { AppstreamRelease } from '../../../../../src/worker/task/appstream/release'

import { mock } from '../../../../utility/worker'

/**
 * Asserts that the changelog is what we expect
 *
 * @param {Context} t Ava testing context
 * @param {string} data
 * @param {string} expected
 *
 * @throws {Error}
 * @return {void}
 */
function expectChangelog (t, data, expected) {
  const parseOptions = {
    decodeEntities: true,
    normalizeWhitespace: true,
    xmlMode: true
  }

  const $d = cheerio.load(data, parseOptions)
  const $e = cheerio.load(expected, parseOptions)

  const $release = $d('component > releases > release:first-of-type')

  t.log($release.toString())

  t.is($release.attr('version'), $e('release').attr('version'))
  t.is($release.attr('urgency'), $e('release').attr('urgency'))

  // Whitespace is a pain. Remove all of it and hope the tests don't fail
  const dRelease = $release.html().replace(/\s/img, '')
  const eRelease = $e('release').html().replace(/\s/img, '')

  t.is(dRelease, eRelease)
}

test('can insert a basic list of changes', async (t) => {
  const worker = await mock({
    changelog: [{
      author: 'Blake Kostner',
      changes: `This is a change I made
This is another change I made`,
      date: new Date(),
      version: '1.0.0'
    }],
    nameDomain: 'com.github.elementary.houston'
  })

  const p = 'package/usr/share/metainfo/com.github.elementary.houston.appdata.xml'

  await worker.mock('task/appstream/blank.xml', p)

  worker.tasks.push(AppstreamRelease)

  await worker.setup()
  await worker.run()

  worker.context.logs.forEach((l) => t.log(l))

  const file = await fs.readFile(worker.get(p), 'utf8')

  t.true(worker.passes)
  expectChangelog(t, file, `
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

test('it strips out bad html tags from changes', async (t) => {
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
    nameDomain: 'com.github.elementary.houston'
  })

  const p = 'package/usr/share/metainfo/com.github.elementary.houston.appdata.xml'

  await worker.mock('task/appstream/blank.xml', p)

  worker.tasks.push(AppstreamRelease)

  await worker.setup()
  await worker.run()

  worker.context.logs.forEach((l) => t.log(l))

  const file = await fs.readFile(worker.get(p), 'utf8')

  t.true(worker.passes)
  expectChangelog(t, file, `
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
