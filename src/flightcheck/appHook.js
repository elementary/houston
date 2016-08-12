/**
 * flightcheck/appHook.js
 * Construction of all appHooks
 *
 * @exports {Class} - an appHook class to extend appon
 */

import fs from 'fs'
import path from 'path'

import config from '~/lib/config'
import log from '~/lib/log'
import Mistake from '~/lib/mistake'
import render from '~/lib/render'

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

    this.folder = data.dir

    this.name = obj.name || 'appHook'
    this.path = obj.path || path.join(__dirname, 'pipes', this.name)
    this.mark = obj.mark || 'issue.md'
    this.post = obj.post || false

    this.errors = []
    this.warnings = []
    this.metadata = {}
    this.information = {}

    if (this.folder == null) {
      throw new Mistake(500, `appHook ${this.name} received no folder to test on`)
    }
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

  file (requested, encoding = 'utf-8') {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(this.folder, requested), { encoding }, (err, data) => {
        if (err && err.code === 'ENOENT') return resolve(null)
        if (err) return reject(err)

        return resolve(data)
      })
    })
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

    template.body += `\n<!-- Houston v${config.houston.version} ${config.houston.commit} in ${config.env} -->`

    return {
      title: template.title,
      body: template.body
    }
  }

  run () {
    return this.test()
    .then(() => this.report())
    .catch((error) => {
      throw new Mistake(500, `flightcheck encountered an error while trying to run ${this.name} test`, error)
    })
  }
}
