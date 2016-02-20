/**
 * core/controller/root.js
 * Handles the dashboard and static pages
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Request } from '~/app'
import { Project } from '~/core/model/project'
import { IsRole } from '~/core/policy/isRole'

let route = new Router()

route.get('/', async (ctx) => {
  await ctx.render('index', {})
})

route.get('/dashboard', IsRole('USER'), async (ctx, next) => {
  const projects = await Request
  .get(`https://api.github.com/user/repos?visibility=public`)
  .auth(ctx.state.user.github.access)
  .then(res => res.body)
  .filter(githubProject => {
    return Request
    .get(`https://api.github.com/repos/${githubProject.full_name}/contents/.apphub`)
    .auth(ctx.state.user.github.access)
    .then(() => true)
    .catch(() => false)
  })
  .map(async githubProject => {
    let dbProject = await Project.findOne({ 'github.id': githubProject.id })
    if (dbProject != null) return dbProject

    // TODO: Verify only owners? of projects can create it
    return Project.create({
      owner: ctx.state.user._id,
      github: {
        id: githubProject.id,
        owner: githubProject.owner.login,
        name: githubProject.name,
        APItoken: ctx.state.user.github.access
      }
    })
  })

  await ctx.render('dashboard', { title: 'Dashboard', projects })
})

export const Route = route
