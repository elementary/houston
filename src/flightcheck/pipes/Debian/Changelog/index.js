/**
 * flightcheck/pipes/Debian/Changelog/index.js
 * Creates a debian/changelog file for a project
 * @flow
 *
 * @exports {Class} - Creates the debian changelog
 */

import path from 'path'
import semver from 'semver'

import File from 'flightcheck/file'
import Pipe from 'flightcheck/pipes/pipe'
import Pipeline from 'flightcheck/pipeline'
import render from 'lib/render'

/**
 * lintChangelogVersion
 * Lints a changelog version for inaccurate data
 *
 * @param {Object} changelog - A changelog version
 * @return {Boolean} True if the changelog version has an error
 */
const lintChangelogVersion = (changelog: Object): Array<Error> => {
  const errors = []

  if (changelog.project == null) {
    errors.push(new Error('Changelog project not found'))
  }

  if (changelog.version == null) {
    errors.push(new Error('Changelog version not found'))
  } else if (semver.clean(changelog.version) == null) {
    errors.push(new Error('Changelog version it valid SemVer'))
  }

  if (changelog.author == null) {
    errors.push(new Error('Changelog author not found'))
  }

  if (changelog.changes == null) {
    errors.push(new Error('Missing list of changes'))
  } else if (typeof changelog.changes !== 'object') {
    errors.push(new Error('Invalid changelog changes'))
  } else if (changelog.changes.length < 1) {
    errors.push(new Error('No changelog changes found'))
  }

  if (changelog.date == null) {
    errors.push(new Error('Changelog date is invalid'))
  }

  return errors
}

/**
 * fixChangelogVersion
 * Adds missing data to changelog version
 *
 * @param {Object} changelog - A changelog version
 * @param {Object} build - A pipeline build
 * @param {String} distribution - The distribution for the package
 * @return {Object}
 */
const fixChangelogVersion = (changelog: Object, build: Object, distribution: string): Object => {
  const change = Object.assign({}, {
    project: build.name,
    version: build.version,
    distribution,
    author: 'elementaryBot',
    changes: ['version bump'],
    date: new Date()
  }, changelog)

  change.version = semver.clean(change.version)

  return change
}

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
  constructor (pipeline: Pipeline) {
    super(pipeline)

    this.data.changelog = [fixChangelogVersion({}, pipeline.build, 'xenial')]
  }

  /**
   * code
   * Creates the debian changelog
   *
   * @param {String} p - folder to create debian folder in
   * @param {String} d - distribution to build
   * @returns {Void}
   */
  async code (p: string = 'repository/debian', d: string = 'xenial') {
    const changelogPath = path.join(p, 'changelog')
    const file = new File(path.resolve(this.pipeline.build.dir, changelogPath))

    if (this.pipeline.build.changelog.length !== 0) {
      this.data.changelog = this.pipeline.build.changelog
    }

    // This is the only thing that is not included in the changelog from the
    // database. So we have to insert it to avoid errors.
    this.data.changelog.map((changelog) => {
      changelog.project = this.pipeline.build.name
      return changelog
    })

    this.data.changelog = this.data.changelog.sort((a, b) => semver.compare(b.version, a.version))

    const errors = lintChangelogVersion(this.data.changelog[0])
    if (errors.length > 0) {
      const [owner, repo] = this.pipeline.build.id.split('/')
      const tag = this.pipeline.build.tag

      await this.log('warn', 'Debian/Changelog/warn.md', { errors, owner, repo, tag })
    }

    this.data.changelog = this.data.changelog.map((a) => fixChangelogVersion(a, this.pipeline.build, d))

    this.data.changelog = this.data.changelog
      .sort((a, b) => semver.compare(b.version, a.version))
      .map((change) => render('flightcheck/pipes/Debian/Changelog/changelog.nun', change, false).body)
      .join('\n\n')

    await file.write(this.data.changelog)
  }
}
