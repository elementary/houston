/**
 * houston/src/worker/worker.ts
 * The master class for repository processing.
 *
 * @exports {Class} Worker - A processing class
 */

import * as fs from 'fs-extra'
import { clone } from 'lodash'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { App } from '../lib/app'
import { Config } from '../lib/config'
import { ICodeRepository } from '../lib/service'
import { EventEmitter } from '../lib/utility/eventemitter'
import { Log } from './log'
import * as type from './type'

const tempDir = path.resolve(os.tmpdir(), 'houston')

export class Worker extends EventEmitter implements type.IWorker {
  /**
   * app
   * The base App container. Used for roles that need access to something.
   *
   * @var {App}
   */
  public app: App

  /**
   * config
   * The configuration to use during processing
   *
   * @var {Config}
   */
  public get config (): Config {
    return this.app.get<Config>(Config)
  }

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
   * postTasks
   * These tasks run after all the tasks and forks are ran. They are usually
   * processing the end result, like uploading packages or logs after the
   * regular tasks are finished.
   *
   * @var {ITaskConstructor[]}
   */
  public postTasks: type.ITaskConstructor[] = []

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
   * @param {App} app - The base App container
   * @param {ICodeRepository} repository - The repository to process on
   * @param {IContext} context - The starting context for building
   */
  constructor (app: App, repository: ICodeRepository, context: type.IContext) {
    super()

    this.app = app
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
    return this.result.failed
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
   * contexts
   * Returns a list of all the contexts this worker has, and all of it's forks
   *
   * @return {IContext[]}
   */
  public get contexts (): type.IContext[] {
    return [
      this.context,
      ...this.forks
        .map((worker) => worker.contexts)
        .reduce((a, b) => [...a, ...b], [])
    ]
  }

  /**
   * runningIndex
   * Returns the currently running task index
   *
   * @return {Number}
   */
  protected get runningIndex (): number {
    if (this.running != null) {
      const tI = this.tasks.findIndex((task) => {
        return (this.running instanceof task)
      })

      if (tI !== -1) {
        return tI
      } else {
        return this.postTasks.findIndex((task) => {
          return (this.running instanceof task)
        })
      }
    }
  }

  /**
   * Returns all the logs that the worker had created. Inserts some helpful
   * information like architecture, distribution, and references to the log as
   * well.
   *
   * @return {ILog[]}
   */
  protected get resultLogs (): type.ILog[] {
    return this.contexts
      .map((ctx) => ctx.logs)
      .reduce((a, b) => [...a, ...b], [])
      .filter((l) => (l != null))
      .reduce((currentLogs, log, i, allLogs) => {
        const allSimilarLogs = allLogs
          .filter((l) => (l.title === log.title))

        const contexts = [...allSimilarLogs, log]
          .map((l) => this.getContextForLog(l))
          .filter((c) => (c != null))

        log.body = this.getContextLogBody(log, contexts)

        const similarLogs = currentLogs
          .filter((l) => (l.title === log.title))

        if (similarLogs.length === 0) {
          return [...currentLogs, log]
        } else {
          return currentLogs
        }
      }, [])
  }

  /**
   * result
   * Returns the result of the worker. Possible, but incomplete if not stopped.
   *
   * @return {IResult}
   */
  public get result (): type.IResult {
    const packages = this.contexts
      .map((ctx) => ctx.package)
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

    const logs = this.resultLogs

    const failed = logs
      .some((l) => (l.level === Log.Level.ERROR))

    return {
      appcenter: appcenters[0],
      appstream: appstreams[0],
      failed,
      logs: (logs || []), // TODO: Why can `logs` be undefined?
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
        const todoTasks = this.tasks.splice(this.runningIndex + 1)
        this.forks.forEach((fork) => {
          fork.tasks = todoTasks
        })

        await Promise.all(this.forks.map((fork) => fork.run()))
      }
    }

    for (const task of this.postTasks) {
      try {
        const taskConstructor = await this.emitAsyncChain<type.ITaskConstructor>('task:start', task)
        this.running = new taskConstructor(this)
        await this.running.run()
      } catch (err) {
        this.report(err)
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
   * @param {Object} [context] - Overwrite for the forked context
   * @return {Worker}
   */
  public async fork (context = {}): Promise<Worker> {
    const newContext = Object.assign({}, this.context, context, { logs: [] })
    const fork = new Worker(this.app, this.repository, newContext)

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

  /**
   * Given a log, we can find what context, or context of a fork the log belongs
   * to. This is useful to get more information about the log's origin like
   * architecture and distribution.
   *
   * @param {ILog} log
   * @return {IContext|null}
   */
  protected getContextForLog (log: type.ILog): type.IContext | null {
    for (const l of this.context.logs) {
      if (l === log) {
        return this.context
      }
    }

    for (const fork of this.forks) {
      const foundChildForkContext = fork.getContextForLog(log)

      if (foundChildForkContext != null) {
        return foundChildForkContext
      }
    }

    return null
  }

  /**
   * Adds some context information to the end of the log
   *
   * @param {type.ILog} log The log to add information to
   * @param {type.IContext[]} contexts Information to add to the log
   * @return {string} New Log body text
   */
  protected getContextLogBody (log: type.ILog, contexts: type.IContext[]): string {
    if (log.body == null || log.body.includes('### Build Information')) {
      return log.body
    }

    const architectures = [...new Set(contexts.map((c) => c.architecture))]
      .filter((a) => (a != null))
    const distributions = [...new Set(contexts.map((c) => c.distribution))]
      .filter((d) => (d != null))
    const references = [...new Set(this.getContextForLog(log).references)]
      .filter((r) => (r != null))

    let body = (log.body || '').trim()

    body += '\n\n### Build Information'

    if (architectures.length > 1) {
      body += `\nAffects Architectures: ${architectures.join(', ')}`
    } else if (architectures.length === 1) {
      body += `\nAffects Architecture: ${architectures[0]}`
    }

    if (distributions.length > 1) {
      body += `\nAffects Distributions: ${distributions.join(', ')}`
    } else if (distributions.length === 1) {
      body += `\nAffects Distribution: ${distributions[0]}`
    }

    if (references.length > 0) {
      body += '\nBuilt with the following references:'
      for (const reference of references) {
        body += `\n- ${reference}`
      }
    }

    return body
  }
}
