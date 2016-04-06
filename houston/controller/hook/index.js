/**
 * houston/controller/hook/index.js
 * Handles all outside service inputs
 *
 * @exports {Object} - Koa router
 */

import Router from 'koa-router'

import * as github from './github'
import * as jenkins from './jenkins'

const route = new Router({
  prefix: '/hook'
})

route.use(github.routes(), github.allowedMethods())
route.use(jenkins.routes(), jenkins.allowedMethods())

export default route
