/**
 * test/lib/database/download.js
 * Tests Download model functions and schema
 */

import mock from 'mock-require'
import moment from 'moment'
import path from 'path'
import test from 'ava'

import { startContainer, stopContainer } from 'test/helpers/database'
import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

let config = null
let container = null
let db = null
let Download = null

test.before(async (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
  container = await startContainer(config.flightcheck.docker)
  db = require(path.resolve(alias.resolve.alias['lib'], 'database', 'connection')).default
  Download = require(path.resolve(alias.resolve.alias['lib'], 'database', 'download')).default

  db.connect(container.mongo)
})

test.after.always((t) => {
  return stopContainer(container)
})

test('push increments all types', async (t) => {
  const release = db.Types.ObjectId()

  await Download.push(release, 1)

  const result = await Download.find({})

  t.not(result.find((r) => (r.type === 'year')), null)
  t.not(result.find((r) => (r.type === 'month')), null)
  t.not(result.find((r) => (r.type === 'day')), null)
  t.not(result.find((r) => (r.type === 'hour')), null)
})

test('push sets current amount on year increment', async (t) => {
  const release = db.Types.ObjectId()

  await Download.push(release, 1)

  const result = await Download.find({})

  const currentYear = moment.utc().get('year')
  const yearResult = result.find((r) => (r.type === 'year'))
  t.is(yearResult.current.total, 1)
  t.is(Object.keys(yearResult.year).length, 1)
  t.is(yearResult.year[currentYear], 1)
})

test('push sets current amount on month increment', async (t) => {
  const release = db.Types.ObjectId()

  await Download.push(release, 1)

  const result = await Download.find({})

  const currentMonth = moment.utc().get('month')
  const endOfYear = moment.utc().endOf('year').toDate()
  const monthResult = result.find((r) => (r.type === 'month'))
  t.is(monthResult.current.total, 1)
  t.is(Object.keys(monthResult.month).length, 1)
  t.is(monthResult.month[currentMonth], 1)
  t.is(monthResult.expireAt.getTime(), endOfYear.getTime())
})

test('push sets current amount on day increment', async (t) => {
  const release = db.Types.ObjectId()

  await Download.push(release, 1)

  const result = await Download.find({})

  const currentDay = moment.utc().get('date')
  const endOfMonth = moment.utc().endOf('month').toDate()
  const dayResult = result.find((r) => (r.type === 'day'))
  t.is(dayResult.current.total, 1)
  t.is(Object.keys(dayResult.day).length, 1)
  t.is(dayResult.day[currentDay], 1)
  t.is(dayResult.expireAt.getTime(), endOfMonth.getTime())
})

test('push sets current amount on hour increment', async (t) => {
  const release = db.Types.ObjectId()

  await Download.push(release, 1)

  const result = await Download.find({})

  const currentHour = moment.utc().get('hour')
  const endOfDay = moment.utc().endOf('day').toDate()
  const hourResult = result.find((r) => (r.type === 'hour'))
  t.is(hourResult.current.total, 1)
  t.is(Object.keys(hourResult.hour).length, 1)
  t.is(hourResult.hour[currentHour], 1)
  t.is(hourResult.expireAt.getTime(), endOfDay.getTime())
})
