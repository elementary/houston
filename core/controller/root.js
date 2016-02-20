/**
 * core/controller/root.js
 * Handles the dashboard and static pages
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'
import _ from 'lodash'

import { Project } from '~/core/model/project'
import { IsRole } from '~/core/policy/isRole'
import { GetProjects } from '~/core/service/github'

let route = new Router()

route.get('/', async (ctx) => {
  return ctx.render('index', {})
})

route.get('/dashboard', IsRole('USER'), async (ctx, next) => {
  const projects = await GetProjects(ctx.user.github.access)
  .map(async project => {
    let dbProject = await Project.findOne({ 'github.id': project.github.id })
    if (dbProject != null) return dbProject

    // TODO: Verify only owners? of projects can create it
    return Project.create(_.extend({
      owner: ctx.user._id
    }, project))
  })
  .map(async project => {
    return await project.toSolid()
  })

  return ctx.render('dashboard', { title: 'Dashboard', projects })
})

export const Route = route
