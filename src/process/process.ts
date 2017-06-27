/**
 * houston/src/process/process.ts
 * The master class for repository processing.
 *
 * @exports {Class} Process - A processing class
 */

import { EventEmitter } from 'events'
import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Config } from '../lib/config/class'
import { Repository } from '../lib/service/base/repository'

export class Process extends EventEmitter {

  /**
   * tempDir
   * The directory to do builds and what not.
   *
   * @var {string}
   */
  protected static tempDir = path.resolve(os.tmpdir(), 'houston')

  /**
   * workspace
   * The directory that contains the working files
   *
   * @var {string}
   */
  public workspace?: string

  /**
   * config
   * The configuration to use during processing
   *
   * @var {Config}
   */
  protected config: Config

  /**
   * repository
   * A repository to use for this process
   *
   * @var {Repository}
   */
  protected repository: Repository

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
      this.workspace = path.resolve(Process.tempDir, uuid())

      const repositoryFolder = path.resolve(this.workspace, 'repository')

      await fs.mkdirs(repositoryFolder)
      await this.repository.clone(repositoryFolder)
    }
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
      await fs.remove(this.workspace)

      this.workspace = undefined
    }
  }

  /**
   * run
   * Runs a task in the current process
   *
   * @param {Task} task - The dot notation of the task to run
   * @param {string} [workspace] - The workspace to run the task in
   * @return {*}
   */
  public async newTask (task, workspace = this.workspace) {
    return new task(this, workspace)
  }
}
