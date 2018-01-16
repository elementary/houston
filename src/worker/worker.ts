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
import { Storable, WorkableConstructor } from './type'

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
   * repository
   * A repository to use for this process
   *
   * @var {Repository}
   */
  public repository: Repository

  /**
   * storage
   * The data to use for the build
   *
   * @var {Storable}
   */
  public storage: Storable

  /**
   * workspace
   * The directory that contains the working files
   *
   * @var {string}
   */
  public workspace?: string

  /**
   * Creates a new worker process
   *
   * @param {Config} config - The configuration to use
   * @param {Repository} repository - The repository to process on
   * @param {Storable} storage - Storage for the worker information
   */
  constructor (config: Config, repository: Repository, storage: Storable) {
    super()

    this.config = config
    this.repository = repository
    this.storage = storage
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

    const work = new workable(this)

    try {
      await work.run()
    } catch (e) {
      this.emit('run:error', e)

      // If it's a Log, but not just a simple Error
      if (!(e instanceof Log)) {
        const log = new Log(Log.Level.ERROR, 'Internal error while running worker')
          .workable(work)
          .wrap(e)

        this.storage.logs.push(log)
      } else {
        this.storage.logs.push(e)
      }
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
   * fails
   * Checks if the worker fails
   *
   * @return {boolean}
   */
  public fails (): boolean {
    for (const log of this.storage.logs) {
      if (log.level === Log.Level.ERROR) {
        return true
      }
    }

    return false
  }

  /**
   * passes
   * Checks if the worker passes
   *
   * @return {boolean}
   */
  public passes (): boolean {
    return (this.fails() === false)
  }
}
