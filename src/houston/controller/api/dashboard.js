/**
 * houston/controller/api/project.js
 * Project api points
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as github from '~/houston/service/github'
import * as policy from '~/houston/policy'
import Project from '~/houston/model/project'

const route = new Router()

route.get('/add', policy.isRole('beta'), async (ctx, next) => {
  const projects = await github.getProjects(ctx.user.github.access)
  .filter(async (repo) => {
    const dbProject = await Project.findOne({ 'github.id': repo.github.id })
    return (dbProject == null) // Only return github repos which have not been added
  })

  ctx.body = {
    data: projects
  }
  return
})

export default route
