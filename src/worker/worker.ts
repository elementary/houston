/**
 * houston/src/worker/worker.ts
 * The master class for repository processing.
 *
 * @exports {Class} Worker - A processing class
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Config } from '../lib/config'
import { Repository } from '../lib/service/base/repository'
import { EventEmitter } from '../lib/utility/eventemitter'
import { Log } from './log'
import { Storable, Workable, WorkableConstructor } from './type'

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
   * If we are currently running the worker
   *
   * @var {Boolean}
   */
  public running = false

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
      await this.emitAsync('setup:start')

      this.workspace = path.resolve(Worker.tempDir, uuid())
      await fs.ensureDir(this.workspace)

      await this.emitAsync('setup:end')
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
    await this.emitAsync('run:start')
    this.running = true

    const work = new workable(this)

    try {
      await work.run()
    } catch (e) {
      this.report(e)
    }

    await this.emitAsync('run:end')
    this.running = false

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
      await this.emitAsync('teardown:start')

      await fs.remove(this.workspace)

      this.workspace = undefined

      await this.emitAsync('teardown:end')
    }
  }

  /**
   * Adds a log/error to storage
   *
   * @param {Error} e
   * @param {Workable} [workable]
   * @return {Worker}
   */
  public report (e: Error, workable?: Workable) {
    // A real error. Not a Log
    if (!(e instanceof Log)) {
      this.emit('run:error', e)

      const log = new Log(Log.Level.ERROR, 'Internal error while running')
        .workable(workable)
        .wrap(e)

      this.storage.logs.push(log)
      this.stop()
    } else {
      this.storage.logs.push(e)

      if (e.level === Log.Level.ERROR) {
        this.stop()
      }
    }

    return this
  }

  /**
   * Stops the build if it's currently running
   *
   * @return {Worker}
   */
  public stop () {
    this.running = false

    return this
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
