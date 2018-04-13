/**
 * houston/src/worker/task/appstream/stripe.spec.ts
 * Tests inserting stripe keys into appstream file
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'

import { AppstreamStripe } from './stripe'

import { mock } from '../../../../test/utility/worker'

test('can insert a basic list of changes', async () => {
  const worker = await mock({
    nameAppstream: 'com.github.elementary.houston.desktop',
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

  expect(worker.passes).toBeTruthy()
  expect($('component > custom > value').text()).toBe('testingvaluehere')

  await worker.teardown()
})
