/**
 * flightcheck/pipes/Debian/Changelog/index.js
 * Creates a debian/changelog file for a project
 *
 * @exports {Class} - Creates the debian changelog
 */

import path from 'path'
import semver from 'semver'

import Pipe from '~/flightcheck/pipes/pipe'
import render from '~/lib/render'

/**
 * DebianChangelog
 * Creates the debian changelog
 */
export default class DebianChangelog extends Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Object} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super(pipeline)

    this.data.changelog = [{
      author: 'rabbitbot',
      changes: ['version bump'],
      date: new Date(),
      distribution: 'xenial',
      project: pipeline.build.name,
      version: pipeline.build.version
    }]
  }

  /**
   * code
   * Creates the debian changelog
   *
   * @param {String} p - folder to create debian folder in
   * @param {String} d - distribution to build
   */
  async code (p = 'repository/debian', d = 'xenial') {
    const changelogPath = path.join(p, 'changelog')
    const file = await this.file(changelogPath, 'raw')

    if (this.pipeline.build.changelog.length !== 0) {
      this.data.changelog = this.pipeline.build.changelog
    }

    const errors = {}

    const changelog = await Promise.map(this.data.changelog, (change, i) => {
      const lintedChange = Object.assign({}, change, {
        distribution: d,
        project: this.pipeline.build.name,
        version: semver.valid(change.version)
      })

      /**
       * thr
       * Adds an error to the collection
       *
       * @type {String} err - the message to show on log
       * @type {Boolean} exit - true to stop the build
       */
      const thr = (err, exit = false) => {
        const i = (lintedChange.version != null) ? lintedChange.version : 'Unknown version'

        if (errors[i] == null) {
          errors[i] = [err]
        } else {
          errors[i].push(err)
        }

        if (exit) throw new Error(err)
      }

      if (lintedChange.version == null) {
        thr('Invalid semver version', true)
      }

      if (lintedChange.author == null) {
        thr('No author')
      }

      if (lintedChange.changes == null || lintedChange.changes.length === 0) {
        thr('No documented changes')
        lintedChange.changes = ['version bump']
      }

      if (lintedChange.date == null) {
        thr('No release date')
        lintedChange.date = new Date()
      }

      return lintedChange
    })
    .catch(() => this.log('error', 'Debian/Changelog/error.md', errors))

    if (Object.keys(errors).length !== 0) {
      await this.log('warn', 'Debian/Changelog/warn.md', errors)
    }

    this.data.changelog = changelog
    .sort((a, b) => semver.compare(b.version, a.version))
    .map((change) => render('flightcheck/pipes/Debian/Changelog/changelog.nun', change, false).body)
    .join('\n\n')

    await file.write(this.data.changelog)
  }
}
