/**
 * houston/controller/hook/aptly.js
 * Handles all nginx inputs for aptly download numbers
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import config from '~/lib/config'
import Project from '~/houston/model/project'

const route = new Router({
  prefix: '/aptly/:key'
})

route.param('key', async (key, ctx, next) => {
  if (key !== config.aptly.public) {
    throw new ctx.Mistake(404)
  }

  await next()
})

/**
 * GET /hook/aptly/:key/download
 * Updates release download count from nginx request
 * TODO: add some unique test, probably with client's ip address
 * TODO: we might want to consider adding an IP origin filter to avoid bad eggs
 *
 * @param {String} file - file path on repository server
 * @param {String} status - status of the file download
 */
route.get('/download', (ctx) => {
  if (ctx.query.file == null) {
    throw new ctx.Mistake(400, 'Missing data')
  }
  if (ctx.query.status == null) {
    throw new ctx.Mistake(400, 'Missing data')
  }

  if (ctx.query.status !== 'OK') {
    ctx.status = 200
    return Promise.resolve()
  }

  const path = ctx.query.file.split('/')

  if (path[1] !== config.aptly.stable || path[path.length - 1].indexOf('.deb') === -1) {
    ctx.status = 200
    return Promise.resolve()
  }

  const filename = path.pop().split('_')

  return Project.update({
    'package.name': filename[0],
    'releases.version': filename[1]
  }, {
    $inc: {
      'downloads': 1,
      'releases.$.downloads': 1
    }
  })
  .then((data) => {
    ctx.status = 200
  })
})

export default route
