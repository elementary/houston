/**
 * houston/controller/api/list.js
 * Publishes some GET lists for AppCenter
 *
 * @exports {Object} - Koa router
 */

import Cache from 'node-cache'
import moment from 'moment'
import Router from 'koa-router'

import Download from 'lib/database/download'
import Project from 'lib/database/project'

const cache = new Cache({ stdTTL: 600 })
const route = new Router({
  prefix: '/newest'
})

/**
 * findReleases
 * Finds the projects with the newest releases.
 *
 * @return {string[]}
 */
const findReleases = async () => {
  const cachedRes = cache.get('findReleases')

  if (cachedRes != null) {
    return cachedRes
  }

  const projects = await Project.aggregate([
    { $unwind: '$releases' },
    { $match: {
      'releases._status': 'DEFER',
      'releases.date.published': { $exists: true }
    }},
    { $sort: { 'releases.date.published': 1 } },
    { $group: { _id: '$_id', 'name': { $first: '$name' }, 'release': { $first: '$releases' } } },
    { $sort: { 'release.date.published': -1 } },
    { $limit: 5 }
  ])
  .then((res) => res.map((p) => p.name))

  cache.set('findReleases', projects)
  return projects
}

/**
 * findProjects
 * Finds the newest projects that have been released.
 *
 * @return {string[]}
 */
const findProjects = async () => {
  const cachedRes = cache.get('findProjects')

  if (cachedRes != null) {
    return cachedRes
  }

  const cachedReleases = await findReleases()
  const projects = await Project.aggregate([
    { $unwind: '$releases' },
    { $match: {
      'releases._status': 'DEFER',
      'releases.date.published': { $exists: true }
    }},
    { $sort: { 'releases.date.published': 1 } },
    { $group: { _id: '$_id', 'name': { $first: '$name' }, 'release': { $first: '$releases' } } },
    { $sort: { 'release.date.published': -1 } },
    { $match: { 'name': { $nin: cachedReleases } } },
    { $limit: 5 }
  ])
  .then((res) => res.map((p) => p.name))

  cache.set('findProjects', projects)
  return projects
}

/**
 * findDownloads
 * Finds the projects with the newest releases.
 *
 * @return {string[]}
 */
const findDownloads = async () => {
  const cachedRes = cache.get('findDownloads')

  if (cachedRes != null) {
    return cachedRes
  }

  const [cachedReleases, cachedProjects] = await Promise.all([findReleases(), findProjects()])
  const currentDay = moment.utc().get('date')
  const projects = await Download.aggregate([
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
    { $match: { 'name': { $size: 1 }, 'name.0': { $nin: [...cachedReleases, ...cachedProjects] } } }, // Avoid deleted projects
    { $limit: 5 }
  ])
  .then((res) => res.map((p) => p.name[0]))

  cache.set('findDownloads', projects)
  return projects
}

/**
 * GET /api/newest/project
 * Finds the newest _first_ published project
 */
route.get('/project', async (ctx) => {
  const projects = await findReleases()

  ctx.status = 200
  ctx.body = { data: projects }

  return
})

/**
 * GET /api/newest
 * Finds the newest _first_ published project
 * DEPRECATED: 05/06/2017 use /api/newest/project endpoint instead
 */
route.get('/', async (ctx) => {
  const projects = await findProjects()

  ctx.status = 200
  ctx.body = { data: projects }

  return
})

/**
 * GET /api/newest/release
 * Finds the newest released project
 */
route.get('/release', async (ctx) => {
  const projects = await findProjects()

  ctx.status = 200
  ctx.body = { data: projects }

  return
})

/**
 * GET /api/newest/downloads
 * Finds the projects with the most downloads in the current day.
 */
route.get('/downloads', async (ctx) => {
  const projects = await findDownloads()

  ctx.status = 200
  ctx.body = { data: projects }

  return
})

export default route
