/**
 * houston/test/spec/worker/task/debian/changelog.ts
 * Tests writing debian changelog files
 */

import { test } from 'ava'
import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { DebianChangelog } from '../../../../../src/worker/task/debian/changelog'
import { IContext } from '../../../../../src/worker/type'

import { context as createContext } from '../../../../utility/worker'

/**
 * Returns the string debian changelog version of a date
 *
 * @param {Date}
 * @return {string}
 */
function debianDate (date: Date): string {
  return date.toUTCString().replace('GMT', '+0000')
}

test('can pull a list out of a markdown changelog', async (t) => {
  const context = createContext({
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

  const changelogDate = debianDate(context.changelog[0].date)

  t.is(await DebianChangelog.template(context), `
io.elementary.houston (0.0.1) loki; urgency=low

  * Fix #1234 stuff doesnt work
  * Another Fix
  * Added some cool thing

 -- Blake Kostner <developer@elementary.io>  ${changelogDate}
  `.trim())
})

test('templates multiple changelogs correctly', async (t) => {
  const context = createContext({
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

  const changelogDate1 = debianDate(context.changelog[0].date)
  const changelogDate2 = debianDate(context.changelog[1].date)
  const changelogDate3 = debianDate(context.changelog[2].date)

  t.is(await DebianChangelog.template(context), `
io.elementary.houston (0.0.3) loki; urgency=low

  * 0.0.3 release whoooo

 -- Blake Kostner <developer@elementary.io>  ${changelogDate1}

io.elementary.houston (0.0.2) loki; urgency=low

  * Fix some weird issues with building

 -- Blake Kostner <developer@elementary.io>  ${changelogDate2}

io.elementary.houston (0.0.1) loki; urgency=low

  * init 1

 -- Blake Kostner <developer@elementary.io>  ${changelogDate3}
  `.trim())
})

test('sorts changes based on date', async (t) => {
  const context = createContext({
    changelog: [{
      author: 'Blake Kostner',
      changes: 'init',
      date: new Date(2010, 0, 1),
      version: '0.0.1'
    }, {
      author: 'Blake Kostner',
      changes: 'release',
      date: new Date(2020, 0, 1),
      version: '1.0.0'
    }]
  })

  const changelogDate1 = debianDate(context.changelog[1].date)
  const changelogDate2 = debianDate(context.changelog[0].date)

  t.is(await DebianChangelog.template(context), `
io.elementary.houston (1.0.0) loki; urgency=low

  * release

 -- Blake Kostner <developer@elementary.io>  ${changelogDate1}

io.elementary.houston (0.0.1) loki; urgency=low

  * init

 -- Blake Kostner <developer@elementary.io>  ${changelogDate2}
  `.trim())
})

test('uses dash package name in the changelog', async (t) => {
  const context = createContext({
    changelog: [{
      author: 'Blake Kostner',
      changes: 'init',
      date: new Date(2010, 0, 1),
      version: '1.0.0'
    }],
    nameDomain: 'com.github.btkostner.this_is_invalid_debian_package_name'
  })

  const changelogDate = debianDate(context.changelog[0].date)
  const template = await DebianChangelog.template(context)

  t.log(template)

  t.is(template.indexOf('com.github.btkostner.this_is_invalid_debian_package_name'), -1)
  t.not(template.indexOf('com.github.btkostner.this-is-invalid-debian-package-name'), -1)
})
