/**
 * flightcheck/pipeline.js
 * Cordinates all pipeline activites
 *
 * @exports {Class} Pipeline - Runs a collection of pipes for an output
 */

import assert from 'assert'
import git from 'nodegit'
import path from 'path'
import semver from 'semver'

import * as fsHelper from '~/lib/helpers/fs'
import config from '~/lib/config'
import log from '~/lib/log'

/**
 * Pipeline
 * Runs a collection of pipes for an output
 */
export default class Pipeline {

  /**
   * Creates a new pipeline
   *
   * @param {Object} build - {
   *   {String} repo - Git repository that hosts the code 'git@github.com:elementary/houston.git'
   *   {String} tag - Git tag for checkout. 'v3.0.0'
   *   {String} [name] - Project name 'com.github.elementary.houston'
   *   {String} [source] - Source of project 'github'
   *   {String} [version] - Version to use for project references '3.0.0'
   *   {Array} [changelog] - [{
   *     {String} author - Author of release 'btkostner'
   *     {Array} changes - List of changes made in release
   *     {Date} date - Date release was pushed
   *     {String} version - Semver version of release '2.9.0'
   *   }]
   *   {String} [auth] - Authentication to use with source. Needed for posting logs and builds
   * }
   */
  constructor (build = {}) {
    this.build = {
      repo: build.repo,
      tag: build.tag,
      name: build.name,
      source: build.source,
      version: build.version || semver.valid(build.tag),
      changelog: build.changelog || [],
      auth: build.auth
    }

    // Check manditory variables first!
    assert(this.build['repo'], 'Pipeline needs a repository to build')
    assert(this.build['tag'], 'Pipeline needs a tag to checkout')

    // Try to determine optional variables first
    if (this.build.source == null && this.build.repo.indexOf('github.com') !== -1) {
      this.build.source = 'github'
    }

    if (this.build.name == null && this.build.source === 'github') {
      // Filter the github information from the repo url
      // Possible urls are https://github.com/vocalapp/vocal
      // and git@github.com:vocalapp/vocal.git
      const splits = this.build.repo.split(/(\/|:)/)
      const owner = splits[splits.length - 3].replace('.', '_')
      const repo = splits[splits.length - 1].replace('.git', '').replace('.', '_')

      this.build.name = `com.github.${owner}.${repo}`
    }

    if (this.build.version == null) {
      this.build.version = semver.valid(this.build.tag)
    }

    // Check to make sure we have everything we need to run
    // This includes all generated data from above
    assert(this.build['name'], 'Pipeline needs a package name to use in build')
    assert(this.build['build'].split('.') >= 3, 'Pipeline needs a valid RDNN package name')
    assert.equal(this.build['source'], 'github', 'Pipeline can only build things from GitHub')
    assert(this.build['version'], 'Pipeline needs a semver version to use in build')

    if (this.build['auth'] == null) {
      log.warn('Pipeline was not given auth code. Will not be able to post logs or builds')
    }

    // Setup some dynamic variables
    this.build.dir = path.join(config.flightcheck.directory, 'projects', this.build.name)
  }

  /**
   * setup
   * Clones repo and sets up workspace for pipeline
   *
   * @return {Void}
   */
  async setup () {
    const repoFolder = path.join(this.build.dir, 'repository')

    // TODO: if there is a repo folder, check to make sure its correct branch or delete it and start again
    await fsHelper.mkdirp(repoFolder)
    const repo = await git.Clone(this.build.repo, repoFolder)
    await repo.checkoutBranch(this.build.tag)
  }

  /**
   * teardown
   * Deletes all remaining files in workspace and other cleanup tasks
   *
   * @return {Void}
   */
  async teardown () {
    if (config.env !== 'development') {
      await fsHelper.rmp(this.build.dir)
      return
    }

    // TODO: This could probably be removed once the repo checking (@see setup) is finished
    log.warn('Flightcheck is running in development mode. Only deleting workspace repo.')
    await fsHelper.rmp(path.join(this.build.dir, 'repository'))
  }

  /**
   * run
   * Runs the pipeline process
   *
   * @returns {Object} - {
   *   {Number} errors - number of errors the hooks aquired
   *   {Number} warnings - number of warnings the hook aquired
   *   {Object} information - information to be updated in the database
   *   {Array} issues - generated issues for GitHub with title and body
   * }
   */
  async run () {
    await this.setup()

    const pipes = await fsHelper.walk(path.join(__dirname, 'pipes'), (path) => {
      if (path.indexOf('/') === -1) return false
      return path.indexOf('pre.js') !== -1
    })
    .map((file) => {
      const Hook = require(path.join(__dirname, 'pipes', file)).default
      return new Hook(this.build)
    })

    log.debug(`Running ${pipes.length} pipes`)

    let results = null
    let error = null
    try {
      results = await Promise.all(pipes)
      .map((pipe) => pipe.run())
      .then((pkg) => {
        const obj = {errors: 0, warnings: 0, information: {}, issues: []}

        pkg.forEach((hookPkg) => {
          obj.errors = hookPkg.errors + obj.errors
          obj.warnings = hookPkg.warnings + obj.warnings
          obj.information = Object.assign(obj.information, hookPkg.information)
          if (hookPkg.issue != null) obj.issues.push(hookPkg.issue)
        })

        return obj
      })
    } catch (err) {
      error = err
    }

    await this.teardown()

    if (error != null) {
      throw error
    } else {
      return results
    }
  }
}
