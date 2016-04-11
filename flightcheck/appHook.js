/**
 * flightcheck/appHook.js
 * Construction of all appHooks
 *
 * @exports {Class} - an appHook class to extend appon
 */

import path from 'path'

import config from '~/lib/config'
import log from '~/lib/log'
import render from '~/lib/render'
import request from '~/lib/request'

/**
 * AppHook
 * an appHook class to extend appon
 *
 * @param {Object} data - Includes project, cycle, and release (if applicible)
 * @param {Object} obj - Extended data for AppHook, including name and path
 */
export default class AppHook {
  constructor (data, obj) {
    this.data = data

    this.name = obj.name || 'appHook'
    this.path = obj.path || path.join(__dirname, this.name)
    this.mark = obj.mark || 'issue.md'
    this.post = obj.post || false

    this.errors = []
    this.warnings = []
    this.metadata = {}
    this.information = {}
  }

  test (data) {
    log.warn(`${this.name} does not have any test`)
    return
  }

  error (msg) {
    this.errors.push(msg)
  }

  warn (msg) {
    this.warnings.push(msg)
  }

  meta (stuff) {
    this.metadata = Object.assign(this.metadata, stuff)
  }

  update (obj) {
    this.information = Object.assign(this.information, obj)
  }

  file (path) {
    return request
    .get(`https://api.github.com/repos/${this.data.project.github.fullName}/contents/${path}?ref=${this.data.tag}`)
    .auth(this.data.project.github.token)
    .then((data) => data.body.content)
    .catch(() => null)
  }

  report () {
    return {
      errors: this.errors.length,
      warnings: this.warnings.length,
      information: this.information,
      issue: (this.errors.length > 0 || this.warnings.length > 0) ? this.issue() : null
    }
  }

  issue () {
    const template = render(path.join(this.path, this.mark), this)

    template.body += `\n<!-- Houston version ${config.houston.version} in ${config.env} environment -->`

    return {
      title: template.title,
      body: template.body
    }
  }

  async run () {
    this.test()
    .then(() => this.report())
  }
}
