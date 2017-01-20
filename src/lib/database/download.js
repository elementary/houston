/**
 * lib/database/download.js
 * Holds package download analytics from telemetry.
 * @flow
 *
 * @exports {Object} schema - Mongoose schema for Download model
 * @exports {Download} default - Mongoose Download model
 */

import moment from 'moment'

import db from './connection'

/**
 * schema
 * Holds data values for download count. Every release has a max of 4 records,
 * each corresponding to an increment type (ex year, month, day, or hour).
 * expiresAt is a mongodb build in used to clean up the record after it's life
 * cycle. hour holds 24 indexes starting at 0, each representing the 24 hours in
 * a day. An hour record should only last 24 hours, before being removed and a
 * new one being created for the new day. On pushing new download numbers, 4
 * records will be upserted, one for each increment.
 *
 * @type {db}
 */
const schema = new db.Schema({
  release: db.Types.ObjectId,
  expireAt: Date,

  current: {
    total: Number // Stores the total amount for the current increment pool
  },

  increment: String, // Stores the increment type (ex year, month, day, or hour)
  // Only one of the below will exist for every record
  year: [Number], // Stores values per year at year index (ex 2016, 2017, etc)
  month: [Number], // Stores values per month at indexes 0 - 11
  day: [Number], // Stores values per day at indexes 1 - 31
  hour: [Number] // Stores values per hour at indexes 0 - 23
})

/**
 * push
 * Increments download count of release
 *
 * @async
 * @param {ObjectId} id - Database ID of release
 * @param {Number} count - Amount to increment by
 * @return {void}
 */
schema.statics.push = function (id: db.Types.ObjectId, count: Number): Promise<> {
  const currentYear = moment().UTC().get('year')
  const currentMonth = moment().UTC().get('month')
  const currentDay = moment().UTC().get('day')
  const currentHour = moment().UTC().get('hour')

  const endOfYear = moment().UTC().endOf('year')
  const endOfMonth = moment().UTC().endOf('month')
  const endOfDay = moment().UTC().endOf('day')

  const yearIncrement = this.update({
    'release': id,
    'increment': 'year'
  }, {
    $inc: {
      'current.total': count,
      [`year.${currentYear}`]: count
    }
  }, { upsert: true })

  const monthIncrement = this.update({
    'release': id,
    'increment': 'month'
  }, {
    $set: {
      'expireAt': endOfYear
    },
    $inc: {
      'current.total': count,
      [`month.${currentMonth}`]: count
    }
  }, { upsert: true })

  const dayIncrement = this.update({
    'release': id,
    'increment': 'day'
  }, {
    $set: {
      'expireAt': endOfMonth
    },
    $inc: {
      'current.total': count,
      [`day.${currentDay}`]: count
    }
  }, { upsert: true })

  const hourIncrement = this.update({
    'release': id,
    'increment': 'hour'
  }, {
    $set: {
      'expireAt': endOfDay
    },
    $inc: {
      'current.total': count,
      [`hour.${currentHour}`]: count
    }
  }, { upsert: true })

  return Promise.all([
    yearIncrement,
    monthIncrement,
    dayIncrement,
    hourIncrement
  ])
}

export { schema }
export default db.model('download', schema)
