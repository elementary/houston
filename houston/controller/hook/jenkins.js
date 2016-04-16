/**
 * houston/controller/hook/jenkins.js
 * Handles all Jenkins inputs
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as aptly from '~/houston/service/aptly'
import * as github from '~/houston/service/github'
import Build from '~/houston/model/build'
import config from '~/lib/config'
import render from '~/lib/render'

const route = new Router({
  prefix: '/jenkins/:key'
})

route.param('key', async (key, ctx, next) => {
  if (key !== config.jenkins.public) {
    throw new ctx.Mistake(401)
  }

  await next()
})

route.get('*', async (ctx, next) => {
  if (!config.github.hook) {
    throw new ctx.Mistake(503)
  }

  await next()
})

// TODO: redo this whole handler, it's messy and unoptimized, plus I think it secretly hates Linux
route.post('/', async (ctx) => {
  if (Object.keys(ctx.request.body).length < 1) {
    throw new ctx.Mistake(400, 'Empty body')
  }

  const jenkins = ctx.request.body.build
  const build = await Build.findByIdAndUpdate(jenkins.parameters.IDENTIFIER, {
    'jenkins.build': jenkins.number
  }, { new: true })
  .exec()
  .catch((error) => {
    throw new ctx.Mistake(500, error)
  })

  if (build == null) {
    throw new ctx.Mistake(404, 'Build not found')
  }

  let status = 'QUEUE'
  if (jenkins.phase === 'STARTED') status = 'BUILD'
  if (jenkins.phase === 'FINALIZED') status = 'FAIL'
  if (jenkins.phase === 'FINALIZED' && jenkins.status === 'SUCCESS') status = 'FINISH'

  return Build.findByIdAndUpdate(build._id, { status }, { new: true })
  .then((build) => {
    if (build.status === 'FAIL') return build.getLog()
    return build
  })
  .then(async (build) => {
    if (build.status === 'FINISH') {
      const project = await build.getProject()
      const cycle = await build.getCycle()
      const version = await cycle.getVersion()

      const keys = await aptly.review(project.name, version, project.distributions)

      return cycle.update({$pushAll: { packages: keys }})
      .then(() => build)
    } else if (build.status === 'FAIL') {
      const project = await build.getProject()

      return github.sendIssue(
        project.github.owner,
        project.github.name,
        project.github.token,
        render('houston/views/build.md', { build }),
        project.github.label
      )
    } else {
      return build
    }
  })
  .then(() => {
    ctx.status = 204
    return
  })
  .catch((err) => {
    throw new ctx.Mistake(500, 'Unable to update build from Jenkins', err)
  })
})

export default route
