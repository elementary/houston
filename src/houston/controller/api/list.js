/**
 * houston/controller/api/list.js
 * Publishes some GET lists for AppCenter
 *
 * @exports {Object} - Koa router
 */

import moment from 'moment'
import Router from 'koa-router'

import Download from 'lib/database/download'
import Project from 'lib/database/project'

const route = new Router({
  prefix: '/newest'
})

/**
 * GET /api/newest
 * Finds the newest _first_ published project
 * DEPRECATED: 05/06/2017 use /api/newest/project endpoint instead
 */
route.get('/', async (ctx) => {
  const projects = await Project.aggregate([
    { $unwind: '$releases' },
    { $match: {
      'releases._status': 'DEFER',
      'releases.date.published': { $exists: true }
    }},
    { $sort: { 'releases.date.published': 1 } },
    { $group: { _id: '$_id', 'name': { $first: '$name' }, 'release': { $first: '$releases' } } },
    { $sort: { 'release.date.published': -1 } },
    { $limit: 10 }
  ])

  ctx.status = 200
  ctx.body = { data: projects.map((p) => p.name) }

  return
})

/**
 * GET /api/newest/release
 * Finds the newest released project
 */
route.get('/release', async (ctx) => {
  const projects = await Project.aggregate([
    { $unwind: '$releases' },
    { $match: {
      'releases._status': 'DEFER',
      'releases.date.published': { $exists: true }
    }},
    { $sort: { 'releases.date.published': -1 } },
    { $group: { _id: '$_id', 'name': { $first: '$name' }, 'release': { $first: '$releases' } } },
    { $sort: { 'release.date.published': -1 } },
    { $limit: 10 }
  ])

  ctx.status = 200
  ctx.body = { data: projects.map((p) => p.name) }

  return
})

/**
 * GET /api/newest/project
 * Finds the newest _first_ published project
 */
route.get('/project', async (ctx) => {
  const projects = await Project.aggregate([
    { $unwind: '$releases' },
    { $match: {
      'releases._status': 'DEFER',
      'releases.date.published': { $exists: true }
    }},
    { $sort: { 'releases.date.published': 1 } },
    { $group: { _id: '$_id', 'name': { $first: '$name' }, 'release': { $first: '$releases' } } },
    { $sort: { 'release.date.published': -1 } },
    { $limit: 10 }
  ])

  ctx.status = 200
  ctx.body = { data: projects.map((p) => p.name) }

  return
})

/**
 * GET /api/newest/downloads
 * Finds the projects with the most downloads in the current day.
 */
route.get('/downloads', async (ctx) => {
  const currentDay = moment.utc().get('date')

  const results = await Download.aggregate([
    { $match: { type: 'month' } },
    { $lookup: {
      from: 'projects',
      localField: 'release',
      foreignField: 'releases._id',
      as: 'project'
    }},
    { $group: {
      _id: '$project._id',
      'name': { $first: '$project.name' },
      'count': { $sum: `$month.${currentDay}` },
      'total': { $sum: '$current.total' }
    }},
    { $sort: { 'count': -1, 'total': -1 } },
    { $match: { 'name': { $size: 1 } } }, // Avoid deleted projects
    { $limit: 10 }
  ])

  ctx.status = 200
  ctx.body = { data: results.map((p) => p.name[0]) }

  return
})

export default route
