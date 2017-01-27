/**
 * houston/controller/admin/index.js
 * Handles beta administration
 *
 * @exports {Object} - Koa router objects
 */

import Router from 'koa-router'

import User from 'lib/database/user'

const route = new Router()

/**
 * GET /admin/beta
 * Returns a list of people waiting to get into beta
 */
route.get('/beta', async (ctx, next) => {
  const users = await User.find({
    right: 'USER',
    'notify.beta': true
  })
  .sort('date.joined')

  return ctx.render('admin/beta', { users })
})

export default route
