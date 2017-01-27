/**
 * houston/controller/index.js
 * Handles all controller routes
 *
 * @exports {Object} - Koa router objects
 */

import Router from 'koa-router'

import admin from './admin'
import api from './api'
import hooks from './hook'

import agreement from './agreement'
import dashboard from './dashboard'
import project from './project'

const route = new Router()

route.use(admin.routes(), admin.allowedMethods())
route.use(api.routes(), api.allowedMethods())
route.use(hooks.routes(), hooks.allowedMethods())

route.use(agreement.routes(), agreement.allowedMethods())
route.use(dashboard.routes(), dashboard.allowedMethods())
route.use(project.routes(), project.allowedMethods())

export default route
