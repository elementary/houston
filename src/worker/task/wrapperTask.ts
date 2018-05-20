/**
 * houston/src/worker/task/wrapperTask.ts
 * Runs a bunch of tasks in a row, collecting errors for later.
 */

import { Log } from '../log'
import { ITaskConstructor } from '../type'
import { Task } from './task'

export class WrapperTask extends Task {
  /**
   * The tasks to run
   *
   * @var {ITaskConstructor[]}
   */
  public get tasks (): ITaskConstructor[] {
    return []
  }

  // BUG: We have to set a no-op setter because Jest will error if we don't
  public set tasks (tasks: ITaskConstructor[]) {
    return
  }

  /**
   * All of the logs that where gathered
   *
   * @var {Log[]}
   */
  public logs: Log[] = []

  /**
   * Returns all of the logs that are errors
   *
   * @return {Log[]}
   */
  protected get errorLogs (): Log[] {
    return this.logs
      .filter((l) => (l.level === Log.Level.ERROR))
  }

  /**
   * Does logic.
   *
   * @async
   * @return {void}
   */
  public async run () {
    await this.runTasks()

    this.logs.forEach((l) => this.worker.report(l))

    if (this.errorLogs.length > 0) {
      this.worker.stop()
    }
  }

  /**
   * Runs all the tasks. This is out of the `run` method to allow easier
   * custom logic for WrapperTask runners
   *
   * @async
   * @return {void}
   */
  protected async runTasks () {
    for (const T of this.tasks) {
      const task = new T(this.worker)

      await task.run()
        .catch((e) => this.catchError(e)) // Binding issue
    }
  }

  /**
   * Catches an error thrown from one of the tasks
   *
   * @param {Error} e
   * @return {void}
   * @throws {Error}
   */
  protected catchError (e: Error): void {
    if (e instanceof Log) {
      this.logs.push(e)
    } else {
      throw e
    }
  }
}
