/**
 * core/controller/hook/jenkins.js
 * Handles all Jenkins inputs
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Config, Log } from '~/app'
import { Build } from '~/core/model/build'
import { SendIssue } from '~/core/service/github'
import { ReviewRepo } from '~/core/service/aptly'

let route = new Router({
  prefix: '/hook/jenkins/:key'
})

route.param('key', async (key, ctx, next) => {
  if (!Config.jenkins) {
    Log.debug('Jenkins is disabled but someone tried to access Jenkins hook')
    return ctx.throw('Jenkins is on vacation right now', 404)
  } else if (key !== Config.jenkins.public) {
    Log.debug('Someone tried to connect to Jenkins with an incorrect key')
    return ctx.throw('Nobody can replace Mr. Jenkins', 404)
  }

  await next()
})

route.post('/', async ctx => {
  if (Object.keys(ctx.request.body).length < 1) {
    Log.debug('An empty body was sent to Jenkins hook')
    return ctx.throw('Empty body', 400)
  }

  const jenkins = ctx.request.body.build
  const build = await Build.findByIdAndUpdate(jenkins.parameters.IDENTIFIER, {
    'jenkins.build': jenkins.number
  }, { new: true })

  if (build == null) {
    return ctx.throw('No Build found', 404)
  }

  let status = 'QUEUE'
  if (jenkins.phase === 'STARTED') status = 'BUILD'
  if (jenkins.phase === 'FINALIZED') status = 'FAIL'
  if (jenkins.phase === 'FINALIZED' && jenkins.status === 'SUCCESS') status = 'FINISH'

  return Build.findByIdAndUpdate(build._id, { 'status': status }, { new: true })
  .then((build) => {
    if (build.status === 'FAIL') return build.getLog()
    return build
  })
  .then(async (build) => {
    if (build.status === 'FINISH') {
      const project = await build.getProject()
      const cycle = await build.getCycle()
      const version = await cycle.getVersion()

      const keys = await ReviewRepo(project.name, version, project.distributions)

      return cycle.update({$pushAll: { packages: keys }})
      .then(() => build)
    } else if (build.status === 'FAIL') {
      const project = await build.getProject()

      return SendIssue({
        title: `Building failed on ${build.dist} ${build.arch}`,
        body: '```\n' + build.log + '\n```'
      }, project)
    }

    return build
  })
  .then((build) => {
    ctx.status = 200
    ctx.body = 'OK'
    return
  })
  .catch((err) => {
    Log.error(err)
    return ctx.throw(500, err)
  })
})

export const Route = route
