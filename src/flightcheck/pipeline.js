/**
 * flightcheck/pipeline.js
 * Cordinates all pipeline activites
 *
 * @exports {Class} Pipeline - Runs a collection of pipes for an output
 */

import _ from 'lodash'
import assert from 'assert'
import git from 'nodegit'
import path from 'path'
import semver from 'semver'

import * as fsHelper from '~/lib/helpers/fs'
import * as pipes from './pipes'
import config from '~/lib/config'
import log from '~/lib/log'

/**
 * Pipeline
 * Wraps a bunch of pipes together
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
   *   {Object[]} [changelog] - a list of changes from the current version
   *   {String} [changelog[].author] - Author of release 'btkostner'
   *   {Array} [changelog[].changes] - List of changes made in release
   *   {Date} changelog[].date - Date release was pushed
   *   {String} changelog[].version - Semver version of release '2.9.0'
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

    // A list of all running / already ran pipes
    this.pipes = []
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
   * start
   * Starts the pipeline process
   *
   * @param {String} [pipe=Director] - inital pipe to start at
   */
  async start (pipe = 'Director') {
    assert(pipes[pipe], `${pipe} does not exist and therefor pipeline cannot be started`)

    return this.setup()
    .then(() => this.require(pipe))
    .finally(() => this.teardown())
  }

  /**
   * require
   * Runs a given pipe, used mostly be already running pipes
   *
   * @param {String} name - name of pipe to run
   * @param {String} [p=this.build.dir] - the path to run the code in (defaults to default git dir)
   * @param {...*} [args] - any arguments. Literally anything...
   * @returns {Object} - pipes data object after completion
   */
  async require (name, p = this.build.dir, ...args) {
    assert(pipes[name], `${name} does not exist and therefor cannot be required`)

    const completeArgs = [p, ...args]

    // check if we have already ran this pipe with given arguments to reduce overhead
    const initalizedPipe = this.pipes.find((pipe) => {
      return (pipe.name === name && _.isEqual(pipe.args, completeArgs))
    })

    if (initalizedPipe != null) {
      // Loaded but not ran uhhh wtf?
      if (initalizedPipe.promise == null) return initalizedPipe.run(completeArgs)
      if (!initalizedPipe.promise.isFufilled) await initalizedPipe.promise

      return initalizedPipe.data
    }

    const pipe = new pipes[name](this)
    this.pipes.push(pipe)

    return pipe.run(completeArgs)
  }
}
