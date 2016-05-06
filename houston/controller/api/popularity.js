/**
 * houston/controller/api/popularity.js
 * api for appcenter popularity contest. This will deviate from JSON spec slightly
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import Project from '~/houston/model/project'

const route = new Router({
  prefix: '/popularity'
})

/**
 * GET /api/popularity
 * Grabs list of projects avalible to download sorted by download count
 * TODO: setup an algorithm taking into account GitHub stats, not just raw download count
 *
 * @param {Number} page[limit] - number of results to return per page
 * @param {Number} page[offset] - number of records to skip while searching
 */
route.get('/', async (ctx) => {
  const query = Project.find({
    'github.private': false,
    'downloads': { $gte: 1 }
  })
  .sort('-downloads')

  // Limit parameter
  let limit = 10

  if (ctx.query['page[limit]'] != null) {
    try {
      limit = Math.abs(Number(ctx.query['page[limit]']))
    } catch (err) {
      ctx.status = 400
      ctx.body = { errors: [{
        status: 400,
        title: 'Bad Request',
        detail: 'Query "page[limit]" needs to be a valid number'
      }]}
      return
    }
  }

  if (limit > 50) {
    ctx.status = 400
    ctx.body = { errors: [{
      status: 400,
      title: 'Bad Request',
      detail: 'Query "page[limit]" has to be 50 or less'
    }]}
    return
  }

  query.limit(limit)

  // Offset parameter
  let offset = 0

  if (ctx.query['page[offset]'] != null) {
    try {
      offset = Math.abs(Number(ctx.query['page[offset]']))
    } catch (err) {
      ctx.status = 400
      ctx.body = { errors: [{
        status: 400,
        title: 'Bad Request',
        detail: 'Query "page[offset]" needs to be a valid number'
      }]}
      return
    }
  }

  query.skip(offset)

  // Clean url for pagation links
  const count = await Project.count({
    'github.private': false,
    'downloads': { $gte: 1 }
  })

  const base = ctx.request.href.split('?')[0]
  const cleanQuery = Object.keys(ctx.request.query).filter((key) => {
    if (key[0] === '?') key = key.substr(1)
    return (key !== 'page[offset]' && key !== 'page[limit]')
  })

  let url = `${base}?`
  cleanQuery.forEach((key) => {
    url += `${key}=${ctx.request.query[key]}`
  })
  if (Object.keys(cleanQuery).length > 0) url += '&'

  let nextPage = offset + limit
  if (count < 1) {
    nextPage = 0
  } else {
    nextPage = count - 1
  }

  // Execute query
  const castedProjects = await Promise.map(query.exec(), async (project) => {
    const data = await project.toNormal()
    const release = project.release.latest

    return {
      type: 'projects',
      id: data.id,
      attributes: {
        package: data.package.name,
        popularity: data.downloads,
        version: release.version
      }
    }
  })

  ctx.body = {
    data: castedProjects,
    links: {
      first: `${url}page[limit]=${limit}&page[offset]=0`,
      prev: `${url}page[limit]=${limit}&page[offset]=${(offset - limit > 0) ? offset - limit : 0}`,
      next: `${url}page[limit]=${limit}&page[offset]=${nextPage}`,
      last: `${url}page[limit]=${limit}&page[offset]=${(count - limit > 0) ? count - limit : 0}`
    }
  }
  return
})

export default route
