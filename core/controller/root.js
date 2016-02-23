/**
 * core/controller/root.js
 * Handles the dashboard and static pages
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'
import _ from 'lodash'

import { Project } from '~/core/model/project'
import { Cycle } from '~/core/model/cycle'
import { IsRole } from '~/core/policy/isRole'
import { IfRole } from '~/core/policy/ifRole'
import { GetProjects } from '~/core/service/github'
import { Log } from '~/app'

let route = new Router()

route.get('/', async (ctx) => {
  return ctx.render('index', { hideUser: true })
})

route.get('/dashboard', IsRole('USER'), async (ctx, next) => {
  const projects = await GetProjects(ctx.user.github.access)
  .map(async project => {
    Log.silly(`Upserting ${project.github.owner}/${project.github.name} project`)
    let dbProject = await Project.findOne({ 'github.id': project.github.id })
    if (dbProject != null) return dbProject

    Log.silly(`Creating a new project for ${project.github.owner}/${project.github.name}`)
    // TODO: Verify only owners? of projects can create it
    return Project.create(_.extend({
      owner: ctx.user._id
    }, project))
  })
  .map(async project => {
    Log.silly(`Grabbing status and version for ${project.github.fullName}`)
    project.status = await project.getStatus()
    project.version = await project.getVersion()

    return project
  })

  // TODO: Get some design input on this, and possibly a unique page
  let reviews = []
  if (IfRole(ctx.user, 'REVIEW')) {
    Log.silly('Grabbing projects waiting to be reviewed')

    reviews = await Cycle.find({
      type: 'RELEASE',
      _status: 'REVIEW'
    })
    .then(async cycles => {
      // TODO: this is more of a gripe with mongoose, but this is horribly inefficent
      for (let i in cycles) {
        Log.silly(`Grabbing project and release for cycle #${cycles[i]._id}`)
        cycles[i].project = await cycles[i].getProject()
        cycles[i].release = await cycles[i].getRelease()
      }

      return cycles
    })
  }

  return ctx.render('dashboard', { title: 'Dashboard', projects, reviews })
})

export const Route = route
