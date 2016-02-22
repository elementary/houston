/**
 * core/controller/hook/jenkins.js
 * Handles all Jenkins inputs
 *
 * @exports {Object} default - Koa router
 */

import Router from 'koa-router'

import { Config, Log } from '~/app'
import { Cycle } from '~/core/model/cycle'

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
  if (ctx.request.body === {}) {
    Log.debug('Incorrect data was sent to Jenkins hook')
    return ctx.throw('Incorrect data sent', 400)
  }

  const jenkins = ctx.request.body.build
  const cycle = await Cycle.findById(jenkins.parameters.CYCLE)

  if (cycle == null) {
    return ctx.throw('No Cycle found', 404)
  }

  let status = 'QUEUE'
  if (jenkins.phase === 'QUEUED') status = 'QUEUE'
  if (jenkins.phase === 'STARTED') status = 'BUILD'
  if (jenkins.phase === 'FAILED') status = 'FAIL'
  if (jenkins.phase === 'FINALIZED') status = 'FINISH'

  return Cycle.findOneAndUpdate({
    _id: jenkins.parameters.CYCLE,
    builds: {
      arch: jenkins.parameters.ARCH,
      dist: jenkins.parameters.DIST
    }
  }, {
    'builds.$.status': status
  })
  .then(d => {
    ctx.status = 200
  })
})

export const Route = route
