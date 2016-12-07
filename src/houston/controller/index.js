/**
 * houston/controller/index.js
 * Handles all controller routes
 *
 * @exports {Object} - Koa router objects
 */

import Router from 'koa-router'

import api from './api'
import hooks from './hook'

import dashboard from './dashboard'
import project from './project'
import purchase from './purchase'

const route = new Router()

route.use(api.routes(), api.allowedMethods())
route.use(hooks.routes(), hooks.allowedMethods())

route.use(dashboard.routes(), dashboard.allowedMethods())
route.use(project.routes(), project.allowedMethods())
route.use(purchase.routes(), purchase.allowedMethods())

export default route
