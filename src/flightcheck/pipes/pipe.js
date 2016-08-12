/**
 * flightcheck/pipe/pipe.js
 * Template class for all other pipes
 *
 * @exports {Pipe} - Master class for all other pipes
 */

import assert from 'assert'
import Docker from 'dockerode'
import path from 'path'
import Promise from 'bluebird'

import * as helpers from '~/lib/helpers'
import config from '~/lib/config'
import File from '~/flightcheck/file'
import log from '~/lib/log'
import render from '~/lib/render'

const docker = new Docker({ socketPath: config.flightcheck.docker })
const fs = Promise.promisifyAll(require('fs'))

/**
 * Pipe
 * an Pipe class to extend appon
 */
export default class Pipe {

  /**
   * Creates a new Pipe
   *
   * @param {Pipeline} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    // This will give the newly created pipe the name of the pipe class
    this.name = this.constructor.name

    // a circular reference back to the pipeline. Two way data binding :+1:
    this.pipeline = pipeline

    // an array of arguments given on pipe RUN (not construction)
    // the first args is _ALWAYS_ the code folder the pipe should be ran in
    this.args = []

    // save the promise of run() for async attachment
    this.promise = null

    // hold resulting data so other pipes can access it
    this.data = {}

    // holds all information from log() done in the pipe
    this.log = {
      debug: [],   // debug - information gathered while testing (file dumps etc)
      info: [],    // info  - information about the test, but not worthy of being talked about (extra data etc)
      warning: [], // warning - information that is incorrect, but automaticlly fixed (incorrect values etc)
      error: []    // error - unrecoverable errors that end the build process (build error etc)
    }
  }

  /**
   * code
   * Actual pipe logic to be replaced with child's code
   *
   * @param {String} [p=this.pipeline.build.dir] - the path to run the code in (defaults to default git dir)
   * @param {...*} [args] - any arguments. Literally anything...
   */
  async code (p = this.pipeline.build.dir, ...args) {
    throw new Error(`${this.name} has no testing code`)
  }

  /**
   * run
   * Runs code function with helpful markers for debuging
   *
   * @param {String} [p=this.pipeline.build.dir] - the path to run the code in (defaults to default git dir)
   * @param {...*} [args] - any arguments. Literally anything...
   * @returns {Object} - pipe's data object
   */
  async run (p = this.pipeline.build.dir, ...args) {
    log.debug(`Starting ${this.name} pipe`)

    this.args = [p, ...args]
    this.promise = this.code(...this.args)

    await this.promise
    .catch((err) => {
      if (err.pipe == null) {
        log.warn(`${this.name} pipe throwed an error`)
      } else {
        log.debug(`${this.name} pipe returned an error`)
      }

      throw err
    })

    log.debug(`Finished ${this.name} pipe`)

    return this.data
  }

  /**
   * require
   * Requires the pipeline to run a given pipe
   *
   * @see Pipeline.pipe()
   *
   * @param {String} name - name of pipe to run
   * @param {String} [p=this.pipeline.build.dir] - the path to run the code in (defaults to default git dir)
   * @param {...*} [args] - any arguments. Literally anything...
   * @returns {Object} - pipes data object after completion
   */
  async require (name, p = this.pipeline.build.dir, ...args) {
    return this.pipeline.require(name, p, ...args)
  }

  /**
   * File
   * Returns file as a string
   *
   * @param {String} p - file path relative to the pipe run directory
   * @param {String} [type=raw] - Type of parser to use for file
   * @param {String} [encoding=utf-8] - File encoding to use for the file
   * @returns {Class} - new File class for requested file
   */
  async File (p, type, fsOpt) {
    return new File(path.join(this.args[0], p), type, fsOpt)
  }

  /**
   * log
   * Templates a markdown file for logging
   *
   * @param {String} level - severity of log (debug, info, warn, error)
   * @param {String} file - path to markdown file (relative to flightcheck/pipes dir)
   * @param {*} [data] - data to send to template file (accessable with `data` var)
   * @param {Boolean} [th] - true if an error should be thrown
   * @returns {Void}
   */
  async log (level, file, data, th = (level === 'error')) {
    assert.notEqual(['debug', 'info', 'warn', 'error'].indexOf(level), -1, 'log requires a valid reporting level')

    const issue = render(path.join(__dirname, file), { data })

    issue.body += `\n\n**Affects**: ${this.pipeline.build.tag} release`
    issue.body += `\n\n<!-- Houston v${config.houston.version} ${config.houston.commit} in ${config.env} -->`

    log.verbose(`${this.name} ${level} log => ${issue.title}`)
    log.silly(`\n${issue.body}`)

    this.log[level].push(issue)

    if (th) throw this.Error(issue.title)
  }

  /**
   * Error
   * Returns a pipe error
   *
   * @param {String} msg - error message
   * @param {String} [code='PIPER'] - an error code
   * @returns {Error} - node error
   */
  Error (msg, code = 'PIPER') {
    const e = new Error(msg)
    e.code = code
    e.pipe = this.name

    return e
  }

  /**
   * docker
   * Runs a docker image with given content
   *
   * @param {String} tag - the docker tag name
   * @param {String} cmd - Commands to run
   * @param {Object} [options] - Other options to pass to docker
   * @returns {Object} - exit information about the container
   * @returns {Number} exit - exit code docker container ended with
   * @returns {String} log - path of docker log file
   */
  async docker (tag, cmd, options = {}) {
    assert.equal(typeof tag, 'string', 'docker requires a valid tag to run')
    assert.equal(typeof cmd, 'string', 'docker requires a command to be ran')

    const defaultMount = `${this.args[0]}:/tmp/flightcheck:rw`

    if (options['Binds'] == null) {
      options['Binds'] = [defaultMount]
    } else {
      options['Binds'].push(defaultMount)
    }

    const dockerImage = `flightcheck-${this.name}-${tag}`.toLowerCase()

    // TODO: we should check sha or something to make sure the image is correct version?
    const imageBool = await new Promise((resolve, reject) => {
      docker.listImages((err, images) => {
        if (err) return reject(err)

        const found = images.find((image) => {
          return image.RepoTags.find((tag) => {
            return (tag === `${dockerImage}:latest`)
          })
        })

        return resolve((found != null))
      })
    })

    assert.equal(imageBool, true, `${dockerImage} docker image was not found!`)

    await helpers.fs.mkdirp(this.pipeline.build.dir)
    const logFile = path.join(this.pipeline.build.dir, `${dockerImage}.log`)
    const logStream = fs.createWriteStream(logFile)

    return new Promise((resolve, reject) => {
      docker.run(dockerImage, cmd.split(' '), logStream, options, (err, data, container) => {
        if (err) return reject(err)

        return resolve({
          exit: data.StatusCode,
          log: `${dockerImage}.log`
        })
      })
    })
  }
}
