/**
 * houston/src/worker/task/task.ts
 * Some worker logic.
 *
 * @exports {Class} Task
 */

import { Log } from '../log'
import { Workable } from '../type'
import { Worker } from '../worker'

export class Task implements Workable {
  /**
   * The current running worker
   *
   * @var {Worker}
   */
  public worker: Worker

  /**
   * Creates a new Task
   *
   * @param {Worker} worker
   */
  constructor (worker: Worker) {
    this.worker = worker
  }

  /**
   * Does logic.
   *
   * @async
   * @return {void}
   */
  public async run () {
    this.worker.emit(`task:${this.constructor.name}:start`)
    //
    this.worker.emit(`task:${this.constructor.name}:end`)
  }

  /**
   * Adds a log/error to storage
   *
   * @param {Error} e
   * @return {Task}
   */
  public report (e: Error) {
    // A real error. Not a Log
    if (!(e instanceof Log)) {
      const log = new Log(Log.Level.ERROR, 'Internal error while running')
        .workable(this)
        .wrap(e)

      this.worker.report(log)
      this.worker.stop()
    } else {
      this.worker.report(e)

      if (e.level === Log.Level.ERROR) {
        this.worker.stop()
      }
    }

    return this
  }
}
