/**
 * houston/controller/api/list.js
 * Publishes some GET lists for AppCenter
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import Project from 'lib/database/project'

const route = new Router({
  prefix: '/newest'
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
    { $group: { _id: '$_id', 'name': { $first: '$name' } } },
    { $limit: 10 }
  ])

  ctx.status = 200
  ctx.body = { data: projects.map((p) => p.name) }

  return
})

export default route
