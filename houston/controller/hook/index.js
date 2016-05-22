/**
 * houston/controller/hook/index.js
 * Handles all outside service inputs
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import aptly from './aptly'
import github from './github'

const route = new Router({
  prefix: '/hook'
})

route.use(aptly.routes(), aptly.allowedMethods())
route.use(github.routes(), github.allowedMethods())

// Use event hook listeners as well
require('./flightcheck')
require('./strongback')

export default route
