/**
 * flightcheck/pipe/pipe.js
 * Template class for all other pipes
 *
 * @exports {Pipe} - Master class for all other pipes
 */

import assert from 'assert'
import Docker from 'dockerode'
import events from 'events'
import path from 'path'
import Promise from 'bluebird'

import * as helpers from 'lib/helpers'
import config from 'lib/config'
import File from 'flightcheck/file'
import Log from 'lib/log'
import render from 'lib/render'

const fs = Promise.promisifyAll(require('fs'))

const docker = new Docker({ socketPath: config.flightcheck.docker })
const log = new Log('flightcheck:Pipe')

/**
 * Pipe
 * an Pipe class to extend appon
 *
 * @extends EventEmitter
 *
 * @fires Pipe#start
 * @fires Pipe#error
 * @fires Pipe#finish
 * @fires Pipe#log
 */
export default class Pipe extends events.EventEmitter {

  /**
   * Creates a new Pipe
   *
   * @param {Pipeline} pipeline - Current running Pipeline
   */
  constructor (pipeline) {
    super()

    // This will give the newly created pipe the name of the pipe class
    this.name = this.constructor.name

    // a circular reference back to the pipeline. Two way data binding :+1:
    this.pipeline = pipeline

    // an array of arguments given on pipe RUN (not construction)
    // the first arg (if applicable) should be the code folder the pipe should be ran in
    this.args = []

    // save the promise of run() for async attachment
    this.promise = null

    // hold resulting data so other pipes can access it
    this.data = {}

    // holds all information from log() done in the pipe
    this.logs = {
      debug: [],   // debug - information gathered while testing (file dumps etc)
      info: [],    // info  - information about the test, but not worthy of being talked about (extra data etc)
      warn: [],    // warn - information that is incorrect, but automaticlly fixed (incorrect values etc)
      error: []    // error - unrecoverable errors that end the build process (build error etc)
    }
  }

  /**
   * code
   * Actual pipe logic to be replaced with child's code
   *
   * @param {...*} [args] - any arguments. Literally anything...
   * @returns {Void}
   */
  async code (...args) {
    throw new Error(`${this.name} has no testing code`)
  }

  /**
   * run
   * Runs code function with helpful markers for debuging
   *
   * @param {...*} [args] - any arguments. Literally anything...
   * @returns {Object} - pipe's data object
   *
   * @fires Pipe#start
   * @fires Pipe#error
   * @fires Pipe#finish
   */
  async run (...args) {
    log.debug(`Starting ${this.name} pipe`)
    this.emit('start')

    this.args = args
    this.promise = this.code(...args)

    await this.promise
    .catch((err) => {
      if (err.pipe != null && err.pipe === this.name) {
        log.warn(`${err.pipe} pipe throwed an error`)
        this.emit('error', err)
      } else if (err.pipe != null) {
        log.debug(`${this.name} is rethrowing an error from ${err.pipe}`)
      } else {
        log.error(`${this.name} has an uncaught error`)
        err.pipe = this.name
        this.emit('error', err)
      }

      throw err
    })

    log.debug(`Finished ${this.name} pipe`)
    this.emit('finish')

    return this.data
  }

  /**
   * require
   * Requires the pipeline to run a given pipe
   *
   * @see Pipeline.require()
   *
   * @param {String} name - name of pipe to run
   * @param {...*} [args] - any arguments. Literally anything...
   * @returns {Object} - pipes data object after completion
   */
  async require (name, ...args) {
    return this.pipeline.require(name, ...args)
  }

  /**
   * file
   * Returns file as a string
   *
   * @param {String} p - file path relative to the pipeline directory
   * @param {String} [type=raw] - Type of parser to use for file
   * @param {String} [encoding=utf-8] - File encoding to use for the file
   * @returns {File} - new File class for requested file
   */
  async file (p, type = 'raw', encoding = 'utf-8') {
    return new File(path.join(this.pipeline.build.dir, p), type, encoding)
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
   *
   * @fires Pipe#log
   */
  async log (level, file, data, th = (level === 'error')) {
    assert.notEqual(['debug', 'info', 'warn', 'error'].indexOf(level), -1, 'log requires a valid reporting level')

    const issue = render(path.join(__dirname, file), { data })

    if (this.pipeline.build.source === 'github' && this.pipeline.build.id != null) {
      issue.body += `\n\n**Affects**: [${this.pipeline.build.tag} release](https://github.com/${this.pipeline.build.id}/releases/tag/${this.pipeline.build.tag})`
    } else {
      issue.body += `\n\n**Affects**: ${this.pipeline.build.tag} release`
    }

    issue.body += '\n\n<!--\n'

    issue.body += `Pipe: ${this.name}\n`
    issue.body += `Pipe time: ${new Date()}\n`
    issue.body += `Houston version: ${config.houston.version} (${config.houston.commit})\n`
    issue.body += `Houston env: ${config.env}\n`

    issue.body += '-->'

    log.info(`${this.name} ${level} log => ${issue.title}`)
    log.debug(`\n${issue.body}`)

    this.logs[level].push(issue)
    this.emit('log', issue)

    if (th) throw this.error(issue.title)
  }

  /**
   * error
   * Returns a pipe error
   *
   * @param {String} msg - error message
   * @param {String} [code='PIPER'] - an error code
   * @returns {Error} - node error
   */
  error (msg, code = 'PIPER') {
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
   * @param {Array} cmd - Commands to run
   * @param {String} [dir] - directory to mount (defaults to pipeline build dir)
   * @param {Object} [options] - Other options to pass to docker
   * @returns {Object} - exit information about the container
   * @returns {Number} exit - exit code docker container ended with
   * @returns {String} log - path of docker log file
   */
  async docker (tag, cmd, dir = this.pipeline.build.dir, options = {}) {
    assert.equal(typeof tag, 'string', 'docker requires a valid tag to run')

    const defaultMount = `${dir}:/tmp/flightcheck:rw`

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
      docker.run(`${dockerImage}:latest`, cmd, logStream, options, (err, data, container) => {
        if (err) return reject(err)

        return resolve({
          exit: data.StatusCode,
          log: `${dockerImage}.log`
        })
      })
    })
  }
}
