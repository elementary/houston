/**
 * core/controller/root.js
 * Handles the dashboard and static pages
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Project } from '~/core/model/project'

let route = new Router()

route.get('/', async (ctx) => {
  await ctx.render('index', {})
})

route.get('/dashboard', async (ctx, next) => {
  const projects = await Project.findOne({}).exec()

  if (projects != null) {
    ctx.body = projects
  } else {
    ctx.body = 'No projects for you'
  }
})

export const Route = route
