/**
 * appHooks/appHook.js
 * Construction of all appHooks
 *
 * @exports {Object} default - an appHook
 */

import _ from 'lodash'
import Nunjucks from 'nunjucks'
import Promise from 'bluebird'

import { Config, Pkg, Log, Request } from '~/app'

let issue = Nunjucks.configure(__dirname)
issue.addGlobal('Config', Config)
issue.addGlobal('Pkg', Pkg)

class AppHook {
  constructor (data, obj) {
    this.data = data

    this.name = obj.name || 'appHook'
    this.path = obj.path || `${__dirname}/${this.name}`
    this.mark = obj.mark || 'issue.md'
    this.post = obj.post || false

    this.errors = []
    this.warnings = []
    this.information = {}
  }

  test (data) {
    Log.warn(`${this.name} does not have any test`)
    return
  }

  error (msg) {
    this.errors.push(msg)
  }

  warn (msg) {
    this.warnings.push(msg)
  }

  update (obj) {
    this.information = _.extend(this.information, obj)
  }

  // TODO: flatten data object
  // TODO: base64 decode all files automaticly?
  file (path) {
    return Request
    .get(`https://api.github.com/repos/${this.data.project.github.fullName}/contents/${path}?ref=${this.data.tag}`)
    .auth(this.data.project.github.token)
    .then(data => data.content)
    .catch(() => false)
  }

  report () {
    return {
      errors: this.errors.length,
      warnings: this.warnings.length,
      information: this.information,
      issue: (this.errors.length > 0 || this.warnings.length > 0) ? this.issue() : null
    }
  }

  // TODO: clean up whitespace removal code
  issue () {
    let template = issue.render(`${this.path}/${this.mark}`, this)

    template = template.split('\n')
    let title = template.find(string => string !== '')

    template.splice(0, template.indexOf(title) + 1)

    template = template.join('\n')

    return {
      title,
      body: template
    }
  }

  run () {
    return this.test().then(() => this.report())
  }
}

export default AppHook
