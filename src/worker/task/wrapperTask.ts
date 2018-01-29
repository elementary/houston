/**
 * houston/src/worker/task/wrapperTask.ts
 * Runs a bunch of tasks in a row, collecting errors for later.
 */

import { Log } from '../log'
import { WorkableConstructor } from '../type'
import { Task } from './task'

export class WrapperTask extends Task {
  /**
   * The tasks to run
   *
   * @var {WorkableConstructor[]}
   */
  public tasks: WorkableConstructor[] = []

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
  protected get errorLogs () {
    return this.logs
      .map((l) => l.level)
      .filter((l) => (l === Log.Level.ERROR))
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

      await task.run().catch(this.catchError)
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
