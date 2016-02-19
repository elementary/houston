/**
 * core/controller/project.js
 * Simple project handling (until official API is set)
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Project } from '~/core/model/project'

// TODO: GitHub hook integration
let route = new Router({
  prefix: '/project/:owner/:name'
})

// TODO: Repo verification with database
route.param('owner', (owner, ctx, next) => {
  if (owner == null) return
  return next()
})

// TODO: Repo verification with database
route.param('name', (name, ctx, next) => {
  if (name == null) return
  return next()
})

route.get('*', async (ctx) => {
  let owner = ctx.owner
  let name = ctx.name

  ctx.project = await Project.findOne({ owner, name }).exec()

  if (ctx.project == null) {
    ctx.body = 'Project not found'
    return
  }
})

route.get('standby', async (ctx, next) => {
  await ctx.project.update({ status: 'STANDBY' })

  ctx.body = `Set ${ctx.project.name} to 'STANDBY'`
})

route.get('build', async (ctx, next) => {
  if (ctx.project.release == null) {
    ctx.body = 'Project needs a release before it can be built'
    return
  }

  await ctx.project.release.createCycle()
  ctx.body = `Created a new cycle for ${ctx.project.name}#${ctx.project.release.version}`
})

export const Route = route
