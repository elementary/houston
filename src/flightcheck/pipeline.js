/**
 * flightcheck/pipeline.js
 * Cordinates all pipeline activites
 *
 * @exports {Class} Pipeline - Runs a collection of pipes for an output
 */

import _ from 'lodash'
import assert from 'assert'
import events from 'events'
import git from 'nodegit'
import path from 'path'
import Promise from 'bluebird'
import semver from 'semver'

import * as fsHelper from 'lib/helpers/fs'
import * as pipes from './pipes'
import config from 'lib/config'
import Log from 'lib/log'

const fs = Promise.promisifyAll(require('fs'))

const log = new Log('flightcheck:Pipeline')

/**
 * Pipeline
 * Wraps a bunch of pipes together
 *
 * @extends EventEmitter
 *
 * @fires Pipeline#pipe:start
 * @fires Pipeline#pipe:error
 * @fires Pipeline#pipe:finish
 * @fires Pipeline#pipe:log
 */
export default class Pipeline extends events.EventEmitter {

  /**
   * Creates a new pipeline
   *
   * @param {Object} build - {
   *   {String} [id] - Repo source identification
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
   *
   *   {String} [stripe] - Public stripe key to attach to AppData file
   * }
   */
  constructor (build = {}) {
    super()

    this.build = {
      id: build.id,
      repo: build.repo,
      tag: build.tag,
      name: build.name,
      source: build.source,
      version: build.version || semver.valid(build.tag),
      changelog: build.changelog || [],
      auth: build.auth,

      stripe: build.stripe
    }

    // Check manditory variables first!
    assert(this.build['repo'], 'Pipeline needs a repository to build')
    assert(this.build['tag'], 'Pipeline needs a tag to checkout')

    // Try to determine optional variables first
    if (this.build.source == null && this.build.repo.indexOf('github.com') !== -1) {
      this.build.source = 'github'
    }

    let owner = null
    let repo = null

    if (this.build.source === 'github') {
      // Filter the github information from the repo url
      // Possible urls are https://github.com/vocalapp/vocal
      // and git@github.com:vocalapp/vocal.git
      const splits = this.build.repo.split(/(\/|:)/)
      owner = splits[splits.length - 3].replace('.', '_')
      repo = splits[splits.length - 1].replace('.git', '').replace('.', '_')
    }

    if (this.build.id == null && this.build.source === 'github') {
      this.build.id = `${owner}/${repo}`
    }

    if (this.build.name == null && this.build.source === 'github') {
      this.build.name = `com.github.${owner}.${repo}`
    }

    if (this.build.version == null) {
      this.build.version = semver.valid(this.build.tag)
    }

    // TODO: Allow changing RDNN in web interface. Less if statements.
    if (this.build.source === 'github' && owner.toLowerCase() === 'elementary') {
      this.build.name = `io.elementary.${repo}`
    }

    // Check to make sure we have everything we need to run
    // This includes all generated data from above
    assert(this.build['name'], 'Pipeline needs a package name to use in build')
    assert(this.build['name'].split('.').length >= 3, 'Pipeline needs a valid RDNN package name')
    assert.equal(this.build['source'], 'github', 'Pipeline can only build things from GitHub')
    assert(this.build['version'], 'Pipeline needs a semver version to use in build')

    if (this.build['auth'] == null) {
      log.warn('Pipeline was not given auth code. Will not be able to post logs or builds')
    }

    this.build.name = this.build.name.toLowerCase()

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

    let repo = null
    try {
      const stat = await fs.statAsync(repoFolder)

      if (stat.isDirectory()) {
        repo = await git.Repository.open(repoFolder)
      } else {
        const e = new Error()
        e.code = 'ENOENT'
        throw e
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        await fsHelper.mkdirp(repoFolder)
        repo = await git.Clone(this.build.repo, repoFolder)

        /**
         * Clones all of the Git submodules for a given repo path
         *
         * @async
         * @param {String} clonePath - Path of the repository
         * @return {void}
         */
        const recursiveClone = async (clonePath) => {
          const subRepo = await git.Repository.open(clonePath)
          await git.Submodule.foreach(subRepo, async (submodule) => {
            await submodule.update(1, new git.SubmoduleUpdateOptions())
            await recursiveClone(path.join(clonePath, submodule.path()))
          })
        }

        await recursiveClone(repoFolder)
      } else {
        throw e
      }
    }

    const ref = await repo.getReference(this.build.tag)

    await repo.checkoutRef(ref, {
      checkoutStrategy: git.Checkout.STRATEGY.FORCE
    })
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

    log.info('Flightcheck is running in development mode. Keeping workspace.')
  }

  /**
   * start
   * Starts the pipeline process
   *
   * @param {String} [pipe=Director] - inital pipe to start at
   * @returns {Void}
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
   * @param {...*} [args] - any arguments. Literally anything...
   * @returns {Object} - pipes data object after completion
   */
  async require (name, ...args) {
    assert(pipes[name], `${name} does not exist and therefor cannot be required`)

    // check if we have already ran this pipe with given arguments to reduce overhead
    const initalizedPipe = this.pipes.find((pipe) => {
      return (pipe.name === name && _.isEqual(pipe.args, args))
    })

    if (initalizedPipe != null) {
      // Loaded but not ran uhhh wtf?
      if (initalizedPipe.promise == null) return initalizedPipe.run(...args)
      if (!initalizedPipe.promise.isFufilled) await initalizedPipe.promise

      return initalizedPipe.data
    }

    const pipe = new pipes[name](this)

    pipe.on('start', (...args) => this.emit('pipe:start', pipe, ...args))
    pipe.on('error', (...args) => this.emit('pipe:error', pipe, ...args))
    pipe.on('finish', (...args) => this.emit('pipe:finish', pipe, ...args))
    pipe.on('log', (...args) => this.emit('pipe:log', pipe, ...args))

    this.pipes.push(pipe)
    return pipe.run(...args)
  }

  /**
   * logs
   * Consolidates all the logs from each pipe
   *
   * @param {String} [level] - start filtering logs at X level
   * @param {String} [pipe] - name of pipe to grab logs from
   * @return {Object[]} - an array of logs
   */
  async logs (level = 'debug', pipe) {
    let pipes = this.pipes
    if (pipe != null) pipes = pipes.filter((p) => (p.name === pipe))

    const logs = []
    const sort = ['debug', 'info', 'warn', 'error']

    pipes.forEach((pipe) => {
      const types = Object.keys(pipe.logs)
      types.forEach((type) => {
        if (sort.indexOf(type) < sort.indexOf(level)) return

        pipe.logs[type].forEach((log) => {
          logs.push(Object.assign({}, log, {
            pipe: pipe.name,
            level: type
          }))
        })
      })
    })

    return logs
  }
}
