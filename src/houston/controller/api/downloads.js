/**
 * houston/controller/api/downloads.js
 * Shows total download counts
 *
 * @exports {Object} - Koa router
 */

import Cache from 'node-cache'
import Router from 'koa-router'

import Download from 'lib/database/download'

const cache = new Cache({ stdTTL: 600 })
const route = new Router({
  prefix: '/downloads'
})

/**
 * findTotal
 * Finds total amount of downloads.
 *
 * @return {number}
 */
const findTotal = async () => {
  const cachedRes = cache.get('findTotal')

  if (cachedRes != null) {
    return cachedRes
  }

  const downloads = await Download.aggregate([
    { $match: { type: 'year' } },
    { $group: { _id: 0, total: { $sum: '$current.total' } } }
  ])

  if (downloads[0] == null) {
    return 0
  }

  const total = downloads[0]['total']

  cache.set('findTotal', total)
  return total
}

/**
 * findMonth
 * Finds total amount of downloads for the month.
 *
 * @return {number}
 */
const findMonth = async () => {
  const cachedRes = cache.get('findMonth')

  if (cachedRes != null) {
    return cachedRes
  }

  const downloads = await Download.aggregate([
    { $match: { type: 'day' } },
    { $group: { _id: 0, total: { $sum: '$current.total' } } }
  ])

  if (downloads[0] == null) {
    return 0
  }

  const total = downloads[0]['total']

  cache.set('findMonth', total)
  return total
}

/**
 * findDay
 * Finds total amount of downloads for the current day.
 *
 * @return {number}
 */
const findDay = async () => {
  const cachedRes = cache.get('findDay')

  if (cachedRes != null) {
    return cachedRes
  }

  const downloads = await Download.aggregate([
    { $match: { type: 'hour' } },
    { $group: { _id: 0, total: { $sum: '$current.total' } } }
  ])

  if (downloads[0] == null) {
    return 0
  }

  const total = downloads[0]['total']

  cache.set('findDay', total)
  return total
}

/**
 * GET /api/downloads/total
 * Returns the amount of downloads that have hit the server.
 */
route.get('/total', async (ctx) => {
  const total = await findTotal()

  ctx.status = 200
  ctx.body = { data: {
    total
  }}

  return
})

/**
 * GET /api/downloads/month
 * Returns the amount of downloads for the current month..
 */
route.get('/month', async (ctx) => {
  const total = await findMonth()

  ctx.status = 200
  ctx.body = { data: {
    total
  }}

  return
})

/**
 * GET /api/downloads/day
 * Returns the amount of downloads for the current day.
 */
route.get('/day', async (ctx) => {
  const total = await findDay()

  ctx.status = 200
  ctx.body = { data: {
    total
  }}

  return
})

export default route
