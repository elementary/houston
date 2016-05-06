/**
 * houston/controller/index.js
 * Handles all controller routes
 *
 * @exports {Object} - Koa router objects
 */

import Router from 'koa-router'

import dash from './dash'
import hooks from './hook'
import project from './project'

const route = new Router()

route.use(hooks.routes(), hooks.allowedMethods())

route.use(dash.routes(), dash.allowedMethods())
route.use(project.routes(), project.allowedMethods())

export default route
