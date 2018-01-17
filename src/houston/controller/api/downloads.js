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
 * Finds a list of downloads for a project based on a time type
 *
 * @async
 * @param {String} type - "year" "month" "day" time frame
 * @return {Object[]}
 */
const findDownloads = async (type) => {
  // I'm so sorry about how bad this query is. Mongodb sucks. Weird hacks
  // and questionable tactics incoming.
  const raw = await Download.aggregate([
    { $match: { type } },
    { $lookup: { from: 'projects', localField: 'release', foreignField: 'releases._id', as: 'project' } },
    { $group: { _id: { $max: '$project.name' }, total: { $sum: '$current.total' } } }
  ])

  return raw.map((row) => ({
    project: row._id,
    downloads: row.total
  }))
    .sort((a, b) => (b.downloads - a.downloads))
}

/**
 * GET /api/downloads/total
 * Returns a list of total download numbers
 */
route.get('/total', async (ctx) => {
  if (cache.get('total') == null) {
    cache.set('total', await findDownloads('year'))
  }

  const data = cache.get('total')

  ctx.status = 200
  ctx.body = { data }

  return
})

/**
 * GET /api/downloads/year
 * Returns a list of download numbers for the current year
 */
route.get('/year', async (ctx) => {
  if (cache.get('year') == null) {
    cache.set('year', await findDownloads('month'))
  }

  const data = cache.get('year')

  ctx.status = 200
  ctx.body = { data }

  return
})

/**
 * GET /api/downloads/month
 * Returns the amount of downloads for the current month
 */
route.get('/month', async (ctx) => {
  if (cache.get('month') == null) {
    cache.set('month', await findDownloads('day'))
  }

  const data = cache.get('month')

  ctx.status = 200
  ctx.body = { data }

  return
})

/**
 * GET /api/downloads/day
 * Returns the amount of downloads for the current day
 */
route.get('/day', async (ctx) => {
  if (cache.get('day') == null) {
    cache.set('day', await findDownloads('hour'))
  }

  const data = cache.get('day')

  ctx.status = 200
  ctx.body = { data }

  return
})

export default route
