/**
 * test/lib/database/download.js
 * Tests Download model functions and schema
 */

import { serial as test } from 'ava'
import mock from 'mock-require'
import moment from 'moment'
import path from 'path'

import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

const config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
const db = require(path.resolve(alias.resolve.alias['lib'], 'database', 'connection.js')).default
const Download = require(path.resolve(alias.resolve.alias['lib'], 'database', 'download')).default

test.before((t) => {
  db.connect(config.database)
})

test.after((t) => {
  db.connection.close()
})

test('incrementByRelease() increments all types', async (t) => {
  const release = db.Types.ObjectId()

  await Download.incrementByRelease(release, 1)

  const result = await Download.find({ release })

  t.is(result.length, 4)
  t.not(result.find((r) => (r.type === 'year')), null)
  t.not(result.find((r) => (r.type === 'month')), null)
  t.not(result.find((r) => (r.type === 'day')), null)
  t.not(result.find((r) => (r.type === 'hour')), null)
})

test('incrementByRelease() sets current amount on year increment', async (t) => {
  const release = db.Types.ObjectId()

  await Download.incrementByRelease(release, 1)

  const result = await Download.find({ release })

  const currentYear = moment.utc().get('year')
  const yearResult = result.find((r) => (r.type === 'year'))
  t.is(yearResult.current.total, 1)
  t.is(Object.keys(yearResult.year).length, 1)
  t.is(yearResult.year[currentYear], 1)
})

test('incrementByRelease() sets current amount on month increment', async (t) => {
  const release = db.Types.ObjectId()

  await Download.incrementByRelease(release, 1)

  const result = await Download.find({ release })

  const currentMonth = moment.utc().get('month')
  const endOfYear = moment.utc().endOf('year').toDate()
  const monthResult = result.find((r) => (r.type === 'month'))
  t.is(monthResult.current.total, 1)
  t.is(Object.keys(monthResult.month).length, 1)
  t.is(monthResult.month[currentMonth], 1)
  t.is(monthResult.expireAt.getTime(), endOfYear.getTime())
})

test('incrementByRelease() sets current amount on day increment', async (t) => {
  const release = db.Types.ObjectId()

  await Download.incrementByRelease(release, 1)

  const result = await Download.find({ release })

  const currentDay = moment.utc().get('date')
  const endOfMonth = moment.utc().endOf('month').toDate()
  const dayResult = result.find((r) => (r.type === 'day'))
  t.is(dayResult.current.total, 1)
  t.is(Object.keys(dayResult.day).length, 1)
  t.is(dayResult.day[currentDay], 1)
  t.is(dayResult.expireAt.getTime(), endOfMonth.getTime())
})

test('incrementByRelease() sets current amount on hour increment', async (t) => {
  const release = db.Types.ObjectId()

  await Download.incrementByRelease(release, 1)

  const result = await Download.find({ release })

  const currentHour = moment.utc().get('hour')
  const endOfDay = moment.utc().endOf('day').toDate()
  const hourResult = result.find((r) => (r.type === 'hour'))
  t.is(hourResult.current.total, 1)
  t.is(Object.keys(hourResult.hour).length, 1)
  t.is(hourResult.hour[currentHour], 1)
  t.is(hourResult.expireAt.getTime(), endOfDay.getTime())
})
