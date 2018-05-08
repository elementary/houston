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
import { ICodeRepository } from '../lib/service'
import { EventEmitter } from '../lib/utility/eventemitter'
import { Log } from './log'
import * as type from './type'

const tempDir = path.resolve(os.tmpdir(), 'houston')

export class Worker extends EventEmitter implements type.IWorker {
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
   * @var {ICodeRepository}
   */
  public repository: ICodeRepository

  /**
   * context
   * The data to use for the build
   *
   * @var {IContext}
   */
  public context: type.IContext

  /**
   * workspace
   * The directory that contains the working files
   *
   * @var {string}
   */
  public workspace: string

  /**
   * tasks
   * All of the tasks to run.
   *
   * @var {ITaskConstructor[]}
   */
  public tasks: type.ITaskConstructor[] = []

  /**
   * forks
   * All of the forks we are going to run after the current task ends.
   *
   * @var {Worker[]}
   */
  public forks: Worker[] = []

  /**
   * If we are currently running the worker
   *
   * @var {Workable}
   */
  public running: type.ITask | null

  /**
   * Creates a new worker process
   *
   * @param {Config} config - The configuration to use
   * @param {ICodeRepository} repository - The repository to process on
   * @param {IContext} context - The starting context for building
   */
  constructor (config: Config, repository: ICodeRepository, context: type.IContext) {
    super()

    this.config = config
    this.repository = repository
    this.context = context

    this.workspace = path.resolve(tempDir, uuid())
  }

  /**
   * fails
   * Checks if the worker fails
   *
   * @return {boolean}
   */
  public get fails (): boolean {
    for (const log of this.context.logs) {
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
  public get passes (): boolean {
    return (this.fails === false)
  }

  /**
   * runningIndex
   * Returns the currently running task index
   *
   * @return {Number}
   */
  protected get runningIndex (): number {
    if (this.running != null) {
      return this.tasks.findIndex((task) => {
        return (this.running instanceof task)
      })
    }
  }

  /**
   * contexts
   * Returns a list of all the contexts this worker has, and all of it's forks
   *
   * @return {IContext[]}
   */
  protected get contexts (): type.IContext[] {
    return [
      this.context,
      ...this.forks
        .map((worker) => worker.contexts)
        .reduce((a, b) => [...a, ...b], [])
    ]
  }

  /**
   * result
   * Returns the result of the worker. Possible, but incomplete if not stopped.
   *
   * @return {IResult}
   */
  public get result (): type.IResult {
    const packages = this.contexts
      .map((ctx) => ({
        path: ctx.packagePath,
        type: ctx.packageSystem
      }))
      .filter((p) => (p != null))

    // We just assume the longest appcenter and appstream fields are the best
    const appcenters = this.contexts
      .map((ctx) => ctx.appcenter)
      .filter((a) => (a != null))
      .sort((a, b) => (JSON.stringify(b).length - JSON.stringify(a).length))

    const appstreams = this.contexts
      .map((ctx) => ctx.appstream)
      .filter((a) => (a != null))
      .sort((a, b) => (b.length - a.length))

    const logs = this.contexts
      .map((ctx) => ctx.logs)
      .reduce((a, b) => [...a, ...b], [])
      .filter((l) => (l != null))
      .reduce((allLogs, log) => {
        const similarLogIndex = allLogs
          .findIndex((l) => (l.title === log.title))

        if (similarLogIndex === -1) {
          return [...allLogs, log]
        }

        const similarLog = allLogs[similarLogIndex]

        if (similarLog.body.length < log.body.length) {
          return allLogs.splice(similarLogIndex, 1, log)
        }
      }, [])

    return {
      appcenter: appcenters[0],
      appstream: appstreams[0],
      failed: this.fails,
      logs,
      packages
    }
  }

  /**
   * setup
   * Creates a workspace for the process
   *
   * @async
   * @return {void}
   */
  public async setup (): Promise<void> {
    await this.emitAsync('setup:start')

    await fs.ensureDir(this.workspace)

    await this.emitAsync('setup:end')
  }

  /**
   * run
   * Runs a bun of tasks. The first param is do match the ITask.
   *
   * @async
   */
  public async run (): Promise<void> {
    await this.emitAsync('run:start')

    for (const task of this.tasks) {
      // Run the tasks given to us
      try {
        const taskConstructor = await this.emitAsyncChain<type.ITaskConstructor>('task:start', task)
        this.running = new taskConstructor(this)
        await this.running.run()
      } catch (err) {
        this.report(err)
      }

      if (this.running == null) {
        break
      }

      // And if we have any forks, stop running the tasks, and run the forks
      if (this.forks.length > 0) {
        const todoTasks = this.tasks.splice(this.runningIndex)
        this.forks.forEach((fork) => {
          fork.tasks = todoTasks
        })

        await Promise.all(this.forks.map((fork) => fork.run()))
        break
      }
    }

    await this.emitAsync('run:end')
    this.stop()
  }

  /**
   * fork
   * Creates a new worker, copying most of the properties from this instance.
   * It will then run all of these forks _AFTER_ the current task is done.
   *
   * @example
   *   Some tests, like setting up the workspace, can have multiple outputs. In
   *   an effort to keep things linear and _hopefully_ easy to understand the
   *   order, this is the way we would make multiple outputs possible. If the
   *   task, it will look at all the repository references and determine what
   *   kinds of packages it can make. Then, for each distribution, it forks.
   *   We end up with 3 different `Worker`s running, and on exit, merging
   *   storages.
   *
   * @async
   * @param {Object} context - Overwrite for the forked context
   * @return {Worker}
   */
  public async fork (context: object): Promise<Worker> {
    const newContext = Object.assign({}, this.context, context)
    const fork = this.constructor(this.config, this.repository, newContext)

    this.forks.push(fork)

    return fork
  }

  /**
   * teardown
   * Removes files and cleans up remaining files
   *
   * @async
   * @return {void}
   */
  public async teardown (): Promise<void> {
    await this.emitAsync('teardown:start')

    await fs.remove(this.workspace)

    await this.emitAsync('teardown:end')
  }

  /**
   * Adds a log/error to storage
   *
   * @param {Error} err
   * @return {Worker}
   */
  public report (err: Error) {
    // A real error. Not a Log
    if (!(err instanceof Log)) {
      this.emit('run:error', err)

      const log = new Log(Log.Level.ERROR, 'Internal error while running')
        .setError(err)

      this.context.logs.push(log)
      this.stop()
    } else {
      this.context.logs.push(err)

      if (err.level === Log.Level.ERROR) {
        this.stop()
      }
    }

    return this
  }

  /**
   * Stops the build if it's currently running
   *
   * @return {IResult}
   */
  public stop (): type.IResult {
    this.running = null

    return this.result
  }
}
