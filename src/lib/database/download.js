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
 * records will be upserted, one for each increment type.
 */
const schema = new db.Schema({
  release: {
    type: db.Schema.ObjectId,
    ref: 'release'
  },
  expireAt: Date,

  current: {
    total: Number // Stores the total amount for the current increment pool
  },

  type: String, // Stores the increment type (ex year, month, day, or hour)
  // Only one of the below will exist for every record
  year: Object, // Stores values per year at year key (ex 2016, 2017, etc)
  month: Object, // Stores values per month at key 0 - 11
  day: Object, // Stores values per day at key 1 - 31
  hour: Object // Stores values per hour at key 0 - 23
})

/**
 * incrementByRelease
 * Increments download count of release
 *
 * @async
 * @param {ObjectId} id - Database ID of release
 * @param {Number} count - Amount to increment by
 * @return {void}
 */
schema.statics.incrementByRelease = function (id: db.Types.ObjectId, count: Number): Promise<> {
  const currentYear = moment.utc().get('year')
  const currentMonth = moment.utc().get('month')
  const currentDay = moment.utc().get('date')
  const currentHour = moment.utc().get('hour')

  const endOfYear = moment.utc().endOf('year').toDate()
  const endOfMonth = moment.utc().endOf('month').toDate()
  const endOfDay = moment.utc().endOf('day').toDate()

  const yearIncrement = this.update({
    'release': id,
    'type': 'year'
  }, {
    $inc: {
      'current.total': count,
      [`year.${currentYear}`]: count
    }
  }, { upsert: true })

  const monthIncrement = this.update({
    'release': id,
    'type': 'month'
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
    'type': 'day'
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
    'type': 'hour'
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

/**
 * findYear
 * Finds download record for latest year increment
 *
 * @async
 * @param {ObjectId} id - Database ID of release
 * @return {Download} - Latest year increment for given release
 */
schema.statics.findYear = function (id: db.Types.ObjectId): Promise<?Object> {
  return this.findOne({
    release: id,
    type: 'year'
  })
    .sort('expireAt', 1)
}

/**
 * findMonth
 * Finds download record for latest month increment
 *
 * @async
 * @param {ObjectId} id - Database ID of release
 * @return {Download} - Latest month increment for given release
 */
schema.statics.findMonth = function (id: db.Types.ObjectId): Promise<?Object> {
  return this.findOne({
    release: id,
    type: 'month'
  })
    .sort('expireAt', 1)
}

/**
 * findDay
 * Finds download record for latest day increment
 *
 * @async
 * @param {ObjectId} id - Database ID of release
 * @return {Download} - Latest day increment for given release
 */
schema.statics.findDay = function (id: db.Types.ObjectId): Promise<?Object> {
  return this.findOne({
    release: id,
    type: 'day'
  })
    .sort('expireAt', 1)
}

/**
 * findHour
 * Finds download record for latest hour increment
 *
 * @async
 * @param {ObjectId} id - Database ID of release
 * @return {Download} - Latest hour increment for given release
 */
schema.statics.findHour = function (id: db.Types.ObjectId): Promise<?Object> {
  return this.findOne({
    release: id,
    type: 'hour'
  })
    .sort('expireAt', 1)
}

/**
 * findTotal
 * Finds the latest total download count for release
 *
 * @async
 * @param {ObjectId} id - Database ID of release
 * @return {Number} - Latest total amount of downloads
 */
schema.statics.findTotal = async function (id: db.Types.ObjectId): Promise<number> {
  const year = await this.findYear(id)

  if (year == null) return 0
  return year.current.total
}

export { schema }
export default db.model('download', schema)
