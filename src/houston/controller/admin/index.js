/**
 * houston/controller/admin/index.js
 * Handles all admin pages
 *
 * @exports {Object} - Koa router objects
 */

import Router from 'koa-router'

import * as policy from 'houston/policy'

import beta from './beta'

const route = new Router({
  prefix: '/admin'
})

route.use(policy.isRole('ADMIN'), policy.isAgreement)

route.use(beta.routes(), beta.allowedMethods())

export default route
