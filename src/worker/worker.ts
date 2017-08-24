/**
 * houston/src/worker/worker.ts
 * The master class for repository processing.
 *
 * @exports {Class} Worker - A processing class
 */

import { EventEmitter } from 'events'
import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Config } from '../lib/config'
import { Repository } from '../lib/service/base/repository'
import { Log } from './log'
import { WorkableConstructor } from './workable'

export class Worker extends EventEmitter {

  /**
   * tempDir
   * The directory to do builds and what not.
   *
   * @var {string}
   */
  protected static tempDir = path.resolve(os.tmpdir(), 'houston')

  /**
   * config
   * The configuration to use during processing
   *
   * @var {Config}
   */
  public config: Config

  /**
   * workspace
   * The directory that contains the working files
   *
   * @var {string}
   */
  public workspace?: string

  /**
   * repository
   * A repository to use for this process
   *
   * @var {Repository}
   */
  public repository: Repository

  /**
   * logs
   * A list of logs that occured while we were working
   *
   * @var {Log[]}
   */
  public logs: Log[]

  /**
   * Creates a new worker process
   *
   * @param {Config} config - The configuration to use
   * @param {Repository} repository - The repository to process on
   */
  constructor (config: Config, repository: Repository) {
    super()

    this.config = config
    this.repository = repository
  }

  /**
   * setup
   * Creates a workspace for the process
   *
   * @async
   * @return {void}
   */
  public async setup (): Promise<void> {
    if (this.workspace == null) {
      this.emit('setup:start')

      this.workspace = path.resolve(Worker.tempDir, uuid())

      const cleanFolder = path.resolve(this.workspace, 'clean')
      const dirtyFolder = path.resolve(this.workspace, 'dirty')

      await fs.mkdirs(cleanFolder)
      await fs.mkdirs(dirtyFolder)

      await this.repository.clone(cleanFolder)

      this.emit('setup:end')
    }
  }

  /**
   * run
   * Runs a role in the worker
   *
   * @async
   * @param {WorkableConstructor} Workable
   * @return {boolean}
   */
  public async run (workable: WorkableConstructor) {
    this.emit('run:start')

    try {
      await (new workable(this)).run()
    } catch (e) {
      this.emit('run:error', e)

      if (e.instanceOf(Log) === false) {
        // TODO: Error report
        const instance = new Log(Log.Level.ERROR, 'Internal Error While Running Houston')
        e = instance.wrap(e)
      }

      this.logs.push(e)
    }

    this.emit('run:end')

    return this.passes()
  }

  /**
   * teardown
   * Removes files and cleans up remaining files
   *
   * @async
   * @return {void}
   */
  public async teardown (): Promise<void> {
    if (this.workspace != null) {
      this.emit('teardown:start')

      await fs.remove(this.workspace)

      this.workspace = undefined

      this.emit('teardown:end')
    }
  }

  /**
   * passes
   * Checks if the worker passes
   *
   * @return {boolean}
   */
  public passes (): boolean {
    for (let i = 0; i++; i < this.logs.length) {
      if (this.logs[i].level === Log.Level.ERROR) {
        return true
      }

      if (this.logs[i].level === Log.Level.WARN) {
        return true
      }
    }

    return false
  }

  /**
   * fails
   * Checks if the worker failed
   *
   * @return {boolean}
   */
  public fails (): boolean {
    return (this.passes() === false)
  }
}
