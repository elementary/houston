/**
 * houston/src/worker/task/debian/controlParser.spec.ts
 * Tests the ability to read and write Debian control files.
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { IContext } from '../../type'
import { DebianChangelog } from './changelog'

import { context as createContext } from '../../../../test/utility/worker'

/**
 * Returns the string debian changelog version of a date
 *
 * @param {Date}
 * @return {string}
 */
function debianDate (date: Date): string {
  return date.toUTCString().replace('GMT', '+0000')
}

test('can pull a list out of a markdown changelog', async () => {
  const storage = createContext({
    changelog: [{
      author: 'Blake Kostner',
      changes: `
# This is a title
### Example markdown changelog

Fixes:
  * Fix #1234 stuff doesnt work
  * Another Fix

Features:
  * Added some cool thing
      `,
      date: new Date(),
      version: '0.0.1'
    }]
  })

  const changelogDate = debianDate(storage.changelog[0].date)

  const value = await DebianChangelog.template(storage)
  expect(value).toBe(`io.elementary.houston (0.0.1) loki; urgency=low

  * Fix #1234 stuff doesnt work
  * Another Fix
  * Added some cool thing

 -- Blake Kostner <developer@elementary.io>  ${changelogDate}`)
})

test('templates multiple changelogs correctly', async () => {
  const storage = createContext({
    changelog: [{
      author: 'Blake Kostner',
      changes: '0.0.3 release whoooo',
      date: new Date(),
      version: '0.0.3'
    }, {
      author: 'Blake Kostner',
      changes: 'Fix some weird issues with building',
      date: new Date(),
      version: '0.0.2'
    }, {
      author: 'Blake Kostner',
      changes: 'init 1',
      date: new Date(),
      version: '0.0.1'
    }]
  })

  const changelogDate1 = debianDate(storage.changelog[0].date)
  const changelogDate2 = debianDate(storage.changelog[1].date)
  const changelogDate3 = debianDate(storage.changelog[2].date)

  const value = await DebianChangelog.template(storage)
  expect(value).toBe(`io.elementary.houston (0.0.3) loki; urgency=low

  * 0.0.3 release whoooo

 -- Blake Kostner <developer@elementary.io>  ${changelogDate1}

io.elementary.houston (0.0.2) loki; urgency=low

  * Fix some weird issues with building

 -- Blake Kostner <developer@elementary.io>  ${changelogDate2}

io.elementary.houston (0.0.1) loki; urgency=low

  * init 1

 -- Blake Kostner <developer@elementary.io>  ${changelogDate3}`)
})
