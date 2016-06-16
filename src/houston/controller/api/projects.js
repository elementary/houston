/**
 * houston/controller/api/project.js
 * Project api points
 *
 * @exports {Object} - Koa router
 */

import semver from 'semver'
import Router from 'koa-router'

import * as policy from '~/houston/policy'
import db from '~/lib/database'
import Project from '~/houston/model/project'

const route = new Router({
  prefix: '/projects'
})

// Checks for project existance in database when a pId paramiter is in url
route.param('pId', async (id, ctx, next) => {
  try {
    id = db.Types.ObjectId(id)
  } catch (err) {
    ctx.status = 422
    ctx.body = { errors: [{
      status: 422,
      source: { pointer: '/parameter/pId' },
      title: 'Invalid ObjectId',
      detail: 'Project id cannot be casted to an ObjectId'
    }]}
    return
  }

  ctx.project = await Project.findById(id)

  if (ctx.project == null) {
    ctx.body = {
      data: null
    }
    return
  }

  if (ctx.project.github.private) {
    if (!ctx.isAuthenticated()) {
      ctx.status = 401
      ctx.body = { errors: [{
        status: 401,
        title: 'Unauthenticated',
        detail: 'You need to be logged in to access this project'
      }]}
      return
    }

    const permission = await policy.ifMember(ctx.project, ctx.user)

    if (!permission) {
      ctx.status = 403
      ctx.body = { errors: [{
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to access this project'
      }]}
      return
    }
  }

  await next()
})

/**
 * castProject
 * casts a project to JSON api spec
 *
 * @param {Object} project - database object of project
 * @returns {Object} - JSON api object
 */
async function castProject (project) {
  const data = await project.toNormal()

  const owner = {
    links: {
      self: `/api/projects/${project.id}/relationships/owner/${data.owner}`,
      related: `/api/users/${data.owner}`
    },
    data: { type: 'users', id: data.owner }
  }

  const releases = data.releases
  .sort((a, b) => semver.compare(a.version, b.version))
  .map((release) => {
    return {
      links: {
        self: `/api/projects/${project.id}/relationships/releases/${release.id}`,
        related: `/api/releases/${release.id}`
      },
      data: {
        type: 'releases',
        id: release.id
      }
    }
  })

  const cycles = data.cycles.map((cycle) => {
    return {
      links: {
        self: `/api/projects/${project.id}/relationships/cycles/${cycle}`,
        related: `/api/cycles/${cycle}`
      },
      data: {
        type: 'cycles',
        id: cycle
      }
    }
  })

  delete data['owner']
  delete data['releases']
  delete data['cycles']

  return {
    type: 'projects',
    id: data.id,
    attributes: data,
    relationships: { owner, releases, cycles }
  }
}

/**
 * GET /api/projects
 * Grabs list of projects
 * TODO: Authenticated routes should be able to see there own project
 *
 * @param {Number} page[limit] - number of results to return per page
 * @param {Number} page[offset] - number of records to skip while searching
 * @param {String} sort - fields to sort by
 */
route.get('/', async (ctx) => {
  const query = Project.find({
    'github.private': false
  })

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

  // Sort parameter
  if (ctx.query['sort'] != null) {
    const sort = ctx.query['sort'].replace('$', '').split(',')
    sort.forEach((value) => query.sort(value))
  }

  // Clean url for pagation links
  const count = await Project.count({ 'github.private': false })

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
  const castedProjects = await Promise.map(query.exec(), (project) => castProject(project))

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

/**
 * GET /api/projects/:pId
 * Grabs single project
 *
 * @param {ObjectId} pId - project id
 */
route.get('/:pId', async (ctx) => {
  const castedProject = await castProject(ctx.project)

  ctx.body = { data: castedProject }
  return
})

export default route
