/**
 * appHooks/appHook.js
 * Construction of all appHooks
 *
 * @exports {Object} default - an appHook
 */

import _ from 'lodash'
import Promise from 'bluebird'

import { Helpers, Log, Request } from '~/app'

let fs = Promise.promisifyAll(require('fs'))

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

  issue () {
    // TODO: add a templating language
    let template = fs.readFileSync(`${this.path}/${this.mark}`, 'utf8')
    template = template.split('\n')

    let title = template[0]
    template.splice(0, 2)
    template = template.join('\n')

    return {
      title: title,
      body: template
    }
  }

  async run () {
    await this.test()
    return this.report()
  }
}

export default AppHook
