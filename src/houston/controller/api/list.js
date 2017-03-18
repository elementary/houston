/**
 * houston/controller/api/list.js
 * Publishes some GET lists for AppCenter
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import { toAPI } from './error'
import * as error from 'lib/error/controller'
import * as helper from './helpers'
import Project from 'lib/database/project'

const route = new Router()

/**
 * GET /api/newest
 * Finds the newest _first_ published project
 */
route.get('/newest', async (ctx) => {
  const projects = await Project.aggregate([
    { $unwind: '$releases' },
    { $match: {
      'releases._status': 'DEFER',
      'releases.date.published': { $exists: true }
    }},
    { $sort: { 'releases.date.published': -1 }},
    { $group: { _id: '$_id', 'name': { $first: '$name' }, 'release': { $first: '$releases' } } },
    { $sort: { 'release.date.published': -1 } },
    { $limit: 10 }
  ])

  ctx.status = 200
  ctx.body = { data: projects.map((p) => p.name) }

  return
})

export default route
