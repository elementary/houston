/**
 * houston/test/spec/worker/task/appstream/stripe.ts
 * Tests inserting stripe keys into appstream file
 */

import { test } from 'ava'
import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'

import { AppstreamStripe } from '../../../../../src/worker/task/appstream/stripe'

import { mock } from '../../../../utility/worker'

test('can insert a basic list of changes', async (t) => {
  const worker = await mock({
    nameDomain: 'com.github.elementary.houston',
    stripe: 'testingvaluehere'
  })

  const p = 'package/usr/share/metainfo/com.github.elementary.houston.appdata.xml'
  await worker.mock('task/appstream/blank.xml', p)

  worker.tasks.push(AppstreamStripe)

  await worker.setup()
  await worker.run()

  const file = await fs.readFile(worker.get(p), 'utf8')
  const $ = cheerio.load(file, { xmlMode: true })

  worker.context.logs.forEach((l) => t.log(l))

  t.true(worker.passes)
  t.is($('component > custom > value').text(), 'testingvaluehere')

  await worker.teardown()
})
